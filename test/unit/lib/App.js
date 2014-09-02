'use strict';

var assert = require('assert');
var express = require('express');
var http = require('http');
var madvoc = require('madvoc-route');
var sinon = require('sinon');
var App = require('../../../tasks/lib/App');
var TemplateEngine = require('../../../tasks/lib/TemplateEngine');

describe('App', function() {
  before(function() {
    this.sinon = sinon.sandbox.create();
  });

  afterEach(function() {
    this.sinon.restore();
  });

  describe('Route Configurator', function() {
    beforeEach(function() {
      this.MyAction = {
        test: this.sinon.stub(),
        test2: this.sinon.stub(),
        test3: this.sinon.stub()
      };

      var macroManager = sinon.createStubInstance(madvoc.RouteMacroManager);
      this.sinon.stub(madvoc, 'RouteMacroManager', function(path) {
        macroManager.replaceMacros.returns('macroManager' + path);
        return macroManager;
      });
    });

    it('should handle simple route actions', function() {
      var app = new App();
      var engine = {
        use: this.sinon.stub()
      };
      app.setEngine(engine);
      app.setRouteFormat(2);

      var classLoader = {
        loadClass: this.sinon.stub().returns(this.MyAction)
      };
      app.setClassLoader(classLoader);

      var routeConfigurator = sinon.createStubInstance(madvoc.RouteConfigurator);
      routeConfigurator.getRoutes.returns([buildRoute('/test', 'actions.MyAction', 'test')]);
      app.setRouteConfigurator(routeConfigurator);

      sinon.assert.calledWithExactly(madvoc.RouteMacroManager, '/test', app.getRouteFormat());
      sinon.assert.calledWithExactly(app.getEngine().use, 'macroManager/test', sinon.match.func);

      assert.strictEqual(0, this.MyAction.test.callCount);
      var middleware = app.getEngine().use.getCall(0).args[1];
      middleware();
      sinon.assert.calledOnce(this.MyAction.test);
    });

    it('should handle custom route actions', function() {
      var app = new App();
      this.sinon.stub(app.getEngine(), 'use');

      var MyActionCustom = function() {};
      MyActionCustom.prototype.test = this.sinon.spy();
      this.sinon.stub(app.getClassLoader(), 'loadClass').returns(MyActionCustom);

      var routeConfigurator = sinon.createStubInstance(madvoc.RouteConfigurator);
      routeConfigurator.getRoutes.returns([buildRoute('/test', 'actions.MyAction', 'test')]);
      app.setRouteConfigurator(routeConfigurator);

      sinon.assert.calledWithExactly(app.getEngine().use, 'macroManager/test', sinon.match.func);

      assert.strictEqual(0, MyActionCustom.prototype.test.callCount);
      var middleware = app.getEngine().use.getCall(0).args[1];
      middleware();
      sinon.assert.calledOnce(MyActionCustom.prototype.test);
    });

    it('should handle different http methods for routes', function() {
      var app = new App();
      this.sinon.stub(app.getEngine(), 'get');
      this.sinon.stub(app.getEngine(), 'use');
      this.sinon.stub(app.getEngine(), 'post');

      this.sinon.stub(app.getClassLoader(), 'loadClass').returns(this.MyAction);

      var routeConfigurator = sinon.createStubInstance(madvoc.RouteConfigurator);
      routeConfigurator.getRoutes.returns([
        buildRoute('/test', 'actions.MyAction', 'test', 'get'),
        buildRoute('/test2', 'actions.MyAction', 'test2'),
        buildRoute('/test3', 'actions.MyAction', 'test3', 'post')
      ]);
      app.setRouteConfigurator(routeConfigurator);

      sinon.assert.calledWithExactly(app.getEngine().get, 'macroManager/test', sinon.match.func);
      sinon.assert.calledWithExactly(app.getEngine().use, 'macroManager/test2', sinon.match.func);
      sinon.assert.calledWithExactly(app.getEngine().post, 'macroManager/test3', sinon.match.func);

      assert.strictEqual(0, this.MyAction.test.callCount, 'Function should not have been called');
      var middleware = app.getEngine().get.getCall(0).args[1];
      middleware();
      sinon.assert.calledOnce(this.MyAction.test);

      assert.strictEqual(0, this.MyAction.test2.callCount, 'Function should not have been called');
      middleware = app.getEngine().use.getCall(0).args[1];
      middleware();
      sinon.assert.calledOnce(this.MyAction.test2);

      assert.strictEqual(0, this.MyAction.test3.callCount, 'Function should not have been called');
      middleware = app.getEngine().post.getCall(0).args[1];
      middleware();
      sinon.assert.calledOnce(this.MyAction.test3);
    });

    it('should clear the router when setting a new configurator', function() {
      var app = new App();
      this.sinon.stub(app.getEngine(), 'use');
      app.getEngine()._router = {};

      var routeConfigurator = sinon.createStubInstance(madvoc.RouteConfigurator);
      routeConfigurator.getRoutes.returns([buildRoute('/test', 'actions.MyAction', 'test')]);
      app.setRouteConfigurator(routeConfigurator);

      assert.strictEqual(null, app.getEngine()._router, 'Router should have been cleared');
    });

    it('should throw errors for invalid route action classes', function() {
      var app = new App();

      this.sinon.stub(app.getClassLoader(), 'loadClass').returns(this.MyAction);
      this.sinon.stub(app.getEngine(), 'use');

      var routeConfigurator = sinon.createStubInstance(madvoc.RouteConfigurator);
      routeConfigurator.getRoutes.returns([buildRoute('/invalid', 'actions.MyAction', 'invalid')]);
      app.setRouteConfigurator(routeConfigurator);

      var middleware = app.getEngine().use.getCall(0).args[1];

      assert.throws(function() {
        middleware();
      },
        Error,
        'Error should be thrown for the invalid route'
      );
    });

    it('should handle static routes', function() {
      var app = new App();
      this.sinon.stub(app.getEngine(), 'use');
      this.sinon.stub(express, 'static').returns('staticReturn');

      var path = '/path/to/test';
      var routeConfigurator = sinon.createStubInstance(madvoc.RouteConfigurator);
      routeConfigurator.getRoutes.returns([buildRoute('/test', null, null, null, path)]);
      app.setRouteConfigurator(routeConfigurator);

      sinon.assert.calledWithExactly(app.getEngine().use, '/test', 'staticReturn');
    });

    it('should ignore non static routes with no action', function() {
      var app = new App();
      this.sinon.stub(app.getEngine(), 'use');

      var routeConfigurator = sinon.createStubInstance(madvoc.RouteConfigurator);
      routeConfigurator.getRoutes.returns([buildRoute('/test', null, null, null, null)]);
      app.setRouteConfigurator(routeConfigurator);

      assert.strictEqual(
        0,
        app.getEngine().use.callCount,
        'The engine should not have been called'
      );
    });
  });

  describe('Locale', function() {
    it('should recompile templates when updating the locale', function() {
      var app = new App();
      app.setTemplateEngine(sinon.createStubInstance(TemplateEngine));

      assert.equal(null, app.getLocale(), 'Initial locale should be null');

      app.updateLocale('pt_BR');

      assert.equal('pt_BR', app.getLocale(), 'Locale should have been updated');
      sinon.assert.calledOnce(app.getTemplateEngine().compileTemplates);
    });

    it('should not recompile templates if locale hasn\'t changed', function() {
      var app = new App();
      app.setTemplateEngine(sinon.createStubInstance(TemplateEngine));

      app.updateLocale(null);

      assert.strictEqual(
        0,
        app.getTemplateEngine().compileTemplates.callCount,
        'The templates should not have been recompiled'
      );
    });

    it('should pass callback to template engine', function() {
      var app = new App();
      app.setTemplateEngine(sinon.createStubInstance(TemplateEngine));

      var callback = this.sinon.stub();
      app.updateLocale('pt_BR', callback);

      assert.strictEqual(0, callback.callCount, 'Callback should not have been called yet');
      sinon.assert.calledOnce(app.getTemplateEngine().compileTemplates);
      assert.strictEqual(
        callback,
        app.getTemplateEngine().compileTemplates.getCall(0).args[3],
        'Callback should have been passed to the compileTemplates call'
      );
    });

    it('should run callback when locale hasn\'t changed', function() {
      var app = new App();

      this.sinon.spy(process, 'nextTick');
      var callback = this.sinon.stub();
      app.updateLocale(null, callback);

      assert.strictEqual(0, callback.callCount, 'Callback should not have been called yet');
      sinon.assert.calledOnce(process.nextTick);
      assert.strictEqual(
        callback,
        process.nextTick.getCall(0).args[0],
        'Callback should have been passed to the process.nextTick call'
      );
    });
  });

  describe('Server', function() {
    it('should start server', function() {
      var server = {
        listen: this.sinon.stub().returnsThis()
      };
      this.sinon.stub(http, 'createServer').returns(server);

      var app = new App();
      app.setServerPort(5000);
      var returnedValue = app.start();

      sinon.assert.calledWithExactly(http.createServer, app.getEngine());
      sinon.assert.calledWithExactly(server.listen, app.getServerPort());
      assert.strictEqual(server, app.getHttpServer(), 'Server should have been set');
      assert.strictEqual(server, returnedValue, 'Server should have been returned');
    });

    it('should start existing server', function() {
      var server = {};
      this.sinon.stub(http, 'createServer');

      var app = new App();
      app.setHttpServer(server);
      var returnedValue = app.start();

      assert.strictEqual(
        0,
        http.createServer.callCount,
        'Should not have created a new server'
      );
      assert.strictEqual(
        server,
        returnedValue,
        'Server should have been returned'
      );
    });

    it('should stop server', function() {
      var server = {
        stop: this.sinon.stub()
      };

      var app = new App();
      app.setHttpServer(server);
      app.stop();

      sinon.assert.calledOnce(server.stop);
    });

    it('should throw if trying to stop non existing server', function() {
      var app = new App();

      assert.throws(function() {
        app.stop();
      },
        Error,
        'Should throw error if there is no server to be stopped'
      );
    });
  });
});

function buildRoute(path, actionClass, actionMethod, httpMethod, alias) {
  var route = new madvoc.Route();
  route.setPath(path);
  route.setActionClass(actionClass);
  route.setActionMethod(actionMethod);
  route.setHttpMethod(httpMethod);
  route.setAlias(alias);

  return route;
}
