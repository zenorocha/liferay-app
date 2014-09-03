'use strict';

var assert = require('assert');
var mockery = require('mockery');
var path = require('path');
var sinon = require('sinon');
var ProductFlavors = require('../../../tasks/lib/ProductFlavors');

describe('ProductFlavors', function() {
  before(function() {
    this.sinon = sinon.sandbox.create();

    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false
    });

    mockery.registerMock('/cwd/config/file/path', {
      defaultConfig: {
        a: 'a',
        b: 'b',
        c: 'c'
      },
      productFlavors: {
        production: {
          b: 'prod_b'
        }
      }
    });
    mockery.registerMock('/cwd/app/config/file/path', {
      defaultConfig: {
        a: 'A',
        d: 'D'
      },
      productFlavors: {
        production: {
          b: 'prod_B',
          d: 'prod_D'
        }
      }
    });
  });

  after(function() {
    mockery.disable();
  });

  afterEach(function() {
    this.sinon.restore();
  });

  it('should generate a config object', function() {
    var productFlavors = new ProductFlavors('config/file/path');
    productFlavors.setAppConfigFilepath('app/config/file/path');

    this.sinon.stub(process, 'cwd').returns('/cwd');

    var config = productFlavors.generateConfig();
    assert.deepEqual({
      a: 'A',
      b: 'b',
      c: 'c',
      d: 'D'
    }, config, 'App config should take precedence over regular config');
  });

  it('should overwrite configs for the given flavor', function() {
    var productFlavors = new ProductFlavors('config/file/path');
    productFlavors.setAppConfigFilepath('app/config/file/path');

    this.sinon.stub(process, 'cwd').returns('/cwd');

    var config = productFlavors.generateConfig('production');

    assert.deepEqual({
      a: 'A',
      b: 'prod_B',
      c: 'c',
      d: 'prod_D'
    }, config, 'Flavor config should take precedence over others');
  });

  it('should generate flavored config from args', function() {
    mockery.registerMock('yargs', {
      argv: {
        flavor: 'production'
      }
    });
    delete require.cache[path.resolve(process.cwd(), 'tasks/lib/ProductFlavors.js')];
    ProductFlavors = require('../../../tasks/lib/ProductFlavors');

    ProductFlavors.prototype.configFilepath = 'config/file/path';
    ProductFlavors.prototype.appConfigFilepath = 'app/config/file/path';
    this.sinon.stub(process, 'cwd').returns('/cwd');

    var config = ProductFlavors.generateFlavoredConfig();

    assert.deepEqual({
      a: 'A',
      b: 'prod_B',
      c: 'c',
      d: 'prod_D'
    }, config, 'Flavor config should take precedence over others');
  });

  it('should throw error for invalid config paths', function() {
    var productFlavors = new ProductFlavors('invalid/config/file/path');
    productFlavors.setAppConfigFilepath('app/config/file/path');

    assert.throws(function() {
      productFlavors.generateConfig();
    },
      Error,
      'Should have thrown error due to invalid config path'
    );
  });
});
