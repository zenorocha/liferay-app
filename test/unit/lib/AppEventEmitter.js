'use strict';

var assert = require('assert');
var sinon = require('sinon');
var AppEventEmitter = require('../../../tasks/lib/AppEventEmitter');

describe('AppEventEmitter', function() {
  it('should emit events', function() {
    var callback = sinon.stub();
    AppEventEmitter.on('myEvent', callback);

    assert.strictEqual(0, callback.callCount, 'Should not have been called yet');

    AppEventEmitter.emit('myEvent');
    sinon.assert.calledOnce(callback);
  });
});
