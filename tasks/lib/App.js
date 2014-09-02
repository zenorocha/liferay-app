'use strict';

var express = require('express');
var http = require('http');
var madvoc = require('madvoc-route');
var path = require('path');
var BaseAction = require('./BaseAction');
var ClassLoader = require('./ClassLoader');
var config = require('./ProductFlavors').generateFlavoredConfig();

/**
 * Provides an application wrapper class to some engine, by default for
 * express.
 * @constructor
 */
function App() {
  this.classLoader = new ClassLoader();
  this.classLoader.setBasePath('dist');
}

/**
 * Holds the class loader reference.
 * @type {ClassLoader}
 */
App.prototype.classLoader = null;

/**
 * Holds the application engine, by default for express.
 * @type {Function}
 */
App.prototype.engine = express();

/**
 * Holds the http server reference returned by `http.createServer`.
 * @type {Object}
 */
App.prototype.httpServer = null;

/**
 * Holds the current application locale, to which it should be translated.
 * @type {String}
 */
App.prototype.locale = null;

/**
 * Holds the Madvoc route configuration handler.
 * @type {madvoc.RouteConfigurator}
 */
App.prototype.routeConfigurator = null;

/**
 * Holds the server port information.
 * @default 3000
 * @type {Number}
 */
App.prototype.serverPort = 3000;

/**
 * Holds the template engine reference. All controllers shares this same
 * reference, hence it only pre compile templates once when app starts.
 * @type {TemplateEngine}
 */
App.prototype.templateEngine = null;

/**
 * Gets the class loader reference.
 * @return {ClassLoader}
 */
App.prototype.getClassLoader = function() {
  return this.classLoader;
};

/**
 * Gets the application engine reference.
 * @return {Function}
 */
App.prototype.getEngine = function() {
  return this.engine;
};

/**
 * Gets the http server reference.
 * @return {Object}
 */
App.prototype.getHttpServer = function() {
  return this.httpServer;
};

/**
 * Gets the current application locale.
 * @return {String}
 */
App.prototype.getLocale = function() {
  return this.locale;
};

/**
 * Gets the madvoc router configuration reference.
 * @return {madvoc.RouterConfiguration}
 */
App.prototype.getRouteConfigurator = function() {
  return this.routeConfigurator;
};

/**
 * Gets the server port.
 * @return {Number}
 */
App.prototype.getServerPort = function() {
  return this.serverPort;
};

/**
 * Gets the template engine reference.
 * @return {TemplateEngine}
 */
App.prototype.getTemplateEngine = function() {
  return this.templateEngine;
};

/**
 * Handles the given route, running the appropriate js code for it.
 * @param {Object} route
 */
App.prototype.handleRoute = function(route) {
  var Class = this.classLoader.loadClass(route.getActionClass());
  var routeActionMethod = route.getActionMethod();

  var action;
  if (typeof Class === 'function') {
    action = new Class();
  } else {
    action = new BaseAction();
    action[routeActionMethod] = Class[routeActionMethod];
  }

  action.app = this;

  var fn = action[routeActionMethod];
  if (!fn) {
    throw new Error('Invalid route ' + this.getRouteConfigurator().getRoutesFilepath() + ' ' + route.toString());
  }

  fn.apply(action, Array.prototype.slice.call(arguments, 1));
};

/**
 * Serves a folder as static.
 * @param {String} filepath File or directory path to be served.
 * @param {String} mountPath Mount path to serve the filepath.
 */
App.prototype.serveStatic = function(mountPath, filepath) {
  this.engine.use(mountPath, express.static(filepath));
};

/**
 * Sets the class loader reference.
 * @param {ClassLoader} classLoader
 */
App.prototype.setClassLoader = function(classLoader) {
  this.classLoader = classLoader;
};

/**
 * Sets the application engine reference.
 * @param {Function} engine
 */
App.prototype.setEngine = function(engine) {
  this.engine = engine;
};

/**
 * Sets the http server reference.
 * @param {Object} httpServer
 */
App.prototype.setHttpServer = function(httpServer) {
  this.httpServer = httpServer;
};

/**
 * Sets the current application locale.
 * @param {String} locale
 */
App.prototype.setLocale = function(locale) {
  this.locale = locale;
};

/**
 * Sets the madvoc route configuration and registers all parsed routes into the
 * application engine, in this case in express.
 * @param {madvoc.RouteConfiguration} routeConfigurator
 */
App.prototype.setRouteConfigurator = function(routeConfigurator) {
  this.routeConfigurator = routeConfigurator;

  // Setting the router to null will cause express to create a new one when it's
  // needed again, which guarantees that only the route handlers added here will work.
  this.getEngine()._router = null;

  // Register routes into app engine.
  var routes = this.routeConfigurator.getRoutes();
  for (var i = 0; i < routes.length; i++) {
    var route = routes[i];

    if (!route.getActionClass()) {
      // If there is no action class, tries to resolve the alias as a static
      // file path.
      var alias = route.getAlias();
      if (alias) {
        this.serveStatic(route.getPath(), path.join(process.cwd(), 'dist', alias));
      }
      continue;
    }

    var macroManager = new madvoc.RouteMacroManager(route.getPath(), config.routeFormat);
    var routePath = macroManager.replaceMacros(':$1($2)', ':$1');

    if (route.getHttpMethod()) {
      var verb = route.getHttpMethod().toLowerCase();
      this.engine[verb](routePath, this.handleRoute.bind(this, route));
    } else {
      this.engine.use(routePath, this.handleRoute.bind(this, route));
    }
  }
};

/**
 * Sets the server port.
 * @param {Number} serverPort
 */
App.prototype.setServerPort = function(serverPort) {
  this.serverPort = serverPort;
};

/**
 * Sets the template engine reference.
 * @param {TemplateEngine} templateEngine
 */
App.prototype.setTemplateEngine = function(templateEngine) {
  this.templateEngine = templateEngine;
};

/**
 * Starts the server.
 * @return {Object} The server reference.
 */
App.prototype.start = function() {
  if (this.httpServer) {
    return this.httpServer;
  }
  var server = http.createServer(this.engine).listen(this.serverPort);
  this.setHttpServer(server);
  return server;
};

/**
 * Stops the running server.
 */
App.prototype.stop = function() {
  if (!this.httpServer) {
    throw new Error('Server is not running.');
  }
  this.httpServer.stop();
};

/**
 * Updates the current locale and calls the given callback once the app is
 * ready for it.
 * @param {String} locale
 * @param {Function} callback
 */
App.prototype.updateLocale = function(locale, callback) {
  if (this.locale === locale) {
    process.nextTick(callback);
  }
  this.setLocale(locale);
  this.getTemplateEngine().compileTemplates('dist', this.getLocale(), {}, callback);
};

module.exports = App;
