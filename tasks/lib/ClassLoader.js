'use strict';

var path = require('path');

/**
 * Class loader utility to load JavaScript classes from qualified route name,
 * e.g. actions.HomeAction#get. Adds a cache layer in order to speed up
 * classes lookup.
 * @constructor
 */
function ClassLoader() {
  this.cache = {};
}

/**
 * Holds the base path to search for the class.
 * @default ''
 * @type {String}
 */
ClassLoader.prototype.basePath = '';

/**
 * Holds the class loader cache.
 * @type {!Object}
 */
ClassLoader.prototype.cache = null;

/**
 * Clears the class loader cache.
 */
ClassLoader.prototype.clearCache = function() {
  this.cache = {};
};

/**
 * Gets the base path for classes lookup.
 * @return {String}
 */
ClassLoader.prototype.getBasePath = function() {
  return this.basePath;
};

/**
 * Loads class based on qualified route name.
 * @param {String} name The qualified route name.
 * @return {Object|Function}
 */
ClassLoader.prototype.loadClass = function(name) {
  var clazz = this.cache[name];
  if (!clazz) {
    try {
      var filePath = path.resolve(process.cwd(), this.getBasePath(), this.makeFilepath_(name));

      // Clear the require cache for this file when first loading it, to make
      // sure we have its most recent version.
      delete require.cache[filePath];

      clazz = this.cache[name] = require(filePath);
    } catch (err) {
      throw new Error('Class ' + name + ' not found.');
    }
  }
  return clazz;
};

/**
 * Makes file path from qualified route name.
 * @return {String}
 * @private
 */
ClassLoader.prototype.makeFilepath_ = function(name) {
  return name.replace(/\./g, path.sep) + '.js';
};

/**
 * Sets the base path for classes lookup.
 * @return {String}
 */
ClassLoader.prototype.setBasePath = function(basePath) {
  this.basePath = basePath;
};

module.exports = ClassLoader;
