'use strict';

var assert = require('assert');
var TemplateEngine = require('../../../tasks/lib/TemplateEngine');

describe('TemplateEngine', function() {
  it('should be instantiable', function() {
    var templateEngine = new TemplateEngine();

    assert.ok(templateEngine);
  });

  it('should define the interface methods', function() {
    var templateEngine = new TemplateEngine();

    assert.doesNotThrow(function() {
      templateEngine.compileTemplates();
      templateEngine.render();
    }
    );
  });
});
