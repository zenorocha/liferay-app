'use strict';

/**
 * Provides a base utility for action classes.
 * @constructor
 */
function BaseAction() {
}

/**
 * Holds the instance to this action's App.
 * @type {App}
 */
BaseAction.prototype.app = null;

/**
 * Gets the template engine reference.
 * @return {TemplateEngine}
 */
BaseAction.prototype.getTemplateEngine = function() {
  return this.app.getTemplateEngine();
};

/**
 * Renders template from name.
 * @param {String} templateName Name or namespace of the template to render.
 * @param {Object} templateData
 * @return {String} Returns the rendered template.
 */
BaseAction.prototype.render = function(templateName, templateData) {
  if (!this.app) {
    throw new Error('App instance not set.');
  }
  return this.getTemplateEngine().render(templateName, templateData, this.app.getLocale());
};

/**
 * Updates the current locale and calls the given callback once the app is ready
 * for it.
 * @param {String} locale
 * @param {Function} callback
 */
BaseAction.prototype.updateLocale = function(locale, callback) {
  if (!this.app) {
    throw new Error('App instance not set.');
  }
  this.app.updateLocale(locale, callback);
};

module.exports = BaseAction;
