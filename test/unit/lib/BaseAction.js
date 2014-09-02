'use strict';

var assert = require('assert');
var sinon = require('sinon');
var BaseAction = require('../../../tasks/lib/BaseAction');
var TemplateEngine = require('../../../tasks/lib/TemplateEngine');

describe('BaseAction', function() {
  before(function() {
    this.sinon = sinon.sandbox.create();
  });

  afterEach(function() {
    this.sinon.restore();
  });

  describe('Rendering', function() {
    it('should throw error if rendering without an app instance', function() {
      var action = new BaseAction();

      assert.throws(function() {
        action.render();
      },
        Error,
        'Should throw error if there is no app to do the rendering'
      );
    });

    it('should render through the app\'s template engine', function() {
      var action = new BaseAction();
      action.app = {
        getLocale: this.sinon.stub().returns('pt_BR'),
        getTemplateEngine: this.sinon.stub().returns(
          sinon.createStubInstance(TemplateEngine)
        )
      };

      var templateName = 'name';
      var templateData = {};
      action.render(templateName, templateData);

      sinon.assert.calledWithExactly(
        action.app.getTemplateEngine().render,
        templateName,
        templateData,
        'pt_BR'
      );
    });
  });

  describe('Locale', function() {
    it('should throw error if updating locale without an app instance', function() {
      var action = new BaseAction();
      var callback = this.sinon.stub();

      assert.throws(function() {
        action.updateLocale('pt_BR', callback);
      },
        Error,
        'Should throw error if there is no app to do the rendering'
      );
    });

    it('should update locale through the app', function() {
      var action = new BaseAction();
      action.app = {
        updateLocale: this.sinon.stub()
      };
      var callback = function() {};

      action.updateLocale('pt_BR', callback);

      sinon.assert.calledWithExactly(action.app.updateLocale, 'pt_BR', callback);
    });
  });
});
