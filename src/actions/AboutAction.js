'use strict';

var util = require('util');
var liferay = require('liferay-sdk');

function AboutAction() {
  liferay.BaseAction.call(this);
}

util.inherits(AboutAction, liferay.BaseAction);

AboutAction.prototype.get = function(req, res) {
  var instance = this;

  var contents = instance.render('views.home', {
    content: instance.render('views.contentAbout'),
    title: 'About'
  });
  res.send(contents);
};

module.exports = AboutAction;
