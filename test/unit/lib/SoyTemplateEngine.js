'use strict';

var assert = require('assert');
var fs = require('fs');
var sinon = require('sinon');
var soynode = require('soynode');
var SoyTemplateEngine = require('../../../tasks/lib/SoyTemplateEngine');

describe('SoyTemplateEngine', function() {
  before(function() {
    this.sinon = sinon.sandbox.create();
  });

  afterEach(function() {
    this.sinon.restore();
  });

  describe('Compiling', function() {
    beforeEach(function() {
      this.sinon.stub(process, 'cwd').returns('/cwd');
      this.sinon.stub(soynode, 'compileTemplates');
      this.sinon.stub(soynode, 'setOptions');
      this.sinon.stub(fs, 'existsSync').returns(true);
    });

    it('should compile templates', function() {
      var soyEngine = new SoyTemplateEngine();

      soynode.compileTemplates.yields();
      soyEngine.compileTemplates('path/to/templates');

      sinon.assert.calledWithExactly(
        soynode.compileTemplates,
        '/cwd/path/to/templates',
        sinon.match.func
      );
    });

    it('should throw error if search path doesn\'t exist', function() {
      var soyEngine = new SoyTemplateEngine();

      fs.existsSync.returns(false);

      assert.throws(function() {
        soyEngine.compileTemplates('path/to/templates');
      },
        Error,
        'Should have thrown error since the search path doesn\'t exist'
      );
    });

    it('should throw error if compiling fails', function() {
      var soyEngine = new SoyTemplateEngine();

      soynode.compileTemplates.yields(new Error());

      assert.throws(function() {
        soyEngine.compileTemplates('path/to/templates');
      },
        Error,
        'Should have thrown a compile error'
      );
    });

    it('should compile templates with locale', function() {
      var soyEngine = new SoyTemplateEngine();

      soyEngine.setTranslationsFilePath('path/to/translations');
      soyEngine.compileTemplates('path/to/templates', 'pt_BR');

      sinon.assert.calledWithExactly(
        soynode.setOptions,
        sinon.match({
          locales: ['pt_BR'],
          messageFilePathFormat: '/cwd/path/to/translations'
        })
      );
      sinon.assert.calledWithExactly(
        soynode.compileTemplates,
        '/cwd/path/to/templates',
        sinon.match.func
      );
    });

    it('should compile templates with custom options', function() {
      var soyEngine = new SoyTemplateEngine();

      var customOptions = {
        locales: ['pt_BR', 'en'],
        messageFilePathFormat: '/path/to/translations'
      };
      soyEngine.compileTemplates('path/to/templates', null, customOptions);

      sinon.assert.calledWithExactly(
        soynode.setOptions,
        sinon.match(customOptions)
      );
      sinon.assert.calledWithExactly(
        soynode.compileTemplates,
        '/cwd/path/to/templates',
        sinon.match.func
      );
    });

    it('should compile templates with custom callback', function() {
      var soyEngine = new SoyTemplateEngine();

      var callback = this.sinon.stub();
      soyEngine.compileTemplates('path/to/templates', null, {}, callback);

      sinon.assert.calledWithExactly(
        soynode.compileTemplates,
        '/cwd/path/to/templates',
        callback
      );
    });
  });

  describe('Rendering', function() {
    it('should render given template', function() {
      var soyEngine = new SoyTemplateEngine();

      var templateFn = this.sinon.stub();
      this.sinon.stub(soynode, 'get').returns(templateFn);

      soyEngine.render('namespace.template');

      sinon.assert.calledWith(soynode.get, 'namespace.template');
      sinon.assert.calledWith(templateFn, sinon.match({}));
    });

    it('should render given template with options', function() {
      var soyEngine = new SoyTemplateEngine();

      var templateFn = this.sinon.stub();
      this.sinon.stub(soynode, 'get').returns(templateFn);

      var data = {};
      var injectedData = {};
      soyEngine.render('namespace.template', data, 'pt_BR', null, injectedData);

      sinon.assert.calledWithExactly(soynode.get, 'namespace.template', 'pt_BR');
      sinon.assert.calledWithExactly(templateFn, data, null, injectedData);
    });

    it('should render given template with layout param', function() {
      var soyEngine = new SoyTemplateEngine();

      var templateFn = this.sinon.stub().returns('renderedTemplate');
      this.sinon.stub(soynode, 'get').onFirstCall().returns(templateFn);

      var layoutFn = this.sinon.stub();
      soynode.get.onSecondCall().returns(layoutFn);

      var data = {};
      var injectedData = {};
      soyEngine.render('namespace.template', data, 'pt_BR', 'namespace.layout', injectedData);

      soynode.get.getCall(0).calledWithExactly('namespace.template', 'pt_BR');
      sinon.assert.calledWithExactly(templateFn, data, null, injectedData);

      soynode.get.getCall(1).calledWithExactly('namespace.layout', 'pt_BR');
      sinon.assert.calledWithExactly(layoutFn, data, null, injectedData);
      assert.strictEqual(data.content, 'renderedTemplate');
    });

    it('should render given template with layout data option', function() {
      var soyEngine = new SoyTemplateEngine();

      var templateFn = this.sinon.stub().returns('renderedTemplate');
      this.sinon.stub(soynode, 'get').onFirstCall().returns(templateFn);

      var layoutFn = this.sinon.stub();
      soynode.get.onSecondCall().returns(layoutFn);

      var data = {
        layout: 'namespace.layout2'
      };
      var injectedData = {};
      soyEngine.render('namespace.template', data, 'pt_BR', 'namespace.layout', injectedData);

      soynode.get.getCall(0).calledWithExactly('namespace.template', 'pt_BR');
      sinon.assert.calledWithExactly(templateFn, data, null, injectedData);

      soynode.get.getCall(1).calledWithExactly('namespace.layout2', 'pt_BR');
      sinon.assert.calledWithExactly(layoutFn, data, null, injectedData);
      assert.strictEqual(data.content, 'renderedTemplate');
    });

    it('should throw error if template doesn\'t exist', function() {
      var soyEngine = new SoyTemplateEngine();

      this.sinon.stub(soynode, 'get').returns(null);

      assert.throws(function() {
        soyEngine.render('namespace.template');
      },
        Error,
        'Should have thrown error for the invalid template'
      );
    });

    it('should throw error if layout doesn\'t exist', function() {
      var soyEngine = new SoyTemplateEngine();

      this.sinon.stub(soynode, 'get').onFirstCall().returns(this.sinon.stub());
      soynode.get.onSecondCall().returns(null);

      assert.throws(function() {
        soyEngine.render('namespace.template', {}, 'pt_BR', 'namespace.layout', {});
      },
        Error,
        'Should have thrown error for the invalid layout'
      );
    });
  });
});
