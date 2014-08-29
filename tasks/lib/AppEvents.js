'use strict';

var EventEmitter = require('events').EventEmitter;

/**
 * Object responsible for the main App events.
 * @type {Object}
 */
var AppEvents = new EventEmitter();

/**
 * Fired when any of the app's routes have been changed.
 *
 * @event routesChange
 */

/**
 * Fired when any of the app's js scripts have been changed.
 *
 * @event scriptsChange
 */

module.exports = AppEvents;
