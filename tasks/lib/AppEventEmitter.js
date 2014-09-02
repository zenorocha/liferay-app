'use strict';

var EventEmitter = require('events').EventEmitter;

/**
 * Object responsible for the main App events.
 * @type {EventEmitter}
 */
var AppEventEmitter = new EventEmitter();

/**
 * Fired when any of the resources have been changed.
 * @event resourcesUpdated
 * @return undefined
 */

module.exports = AppEventEmitter;
