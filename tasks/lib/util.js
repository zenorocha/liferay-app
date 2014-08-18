'use strict';

var es = require('event-stream');
var gulp = require('gulp');
var gutil = require('gulp-util');
var lazypipe = require('lazypipe');
var path = require('path');
var plugins = require('gulp-load-plugins')();
var soynode = require('soynode');
var config = require('./ProductFlavors').generateFlavoredConfig();
var SoyTemplateEngine = require('./SoyTemplateEngine');

module.exports = {
  buildCss: buildCssPipeline(),
  buildFrontMatter: buildFrontMatterPipeline(),
  buildHtml: buildHtmlPipeline(),
  buildHtmlResources: buildHtmlResourcePipeline(),
  buildJavaScript: buildJavaScriptPipeline(),
  buildMarkdown: buildMarkdownPipeline(),
  logError: logError
};

function buildCssPipeline() {
  return lazypipe()
    .pipe(function() {
      return plugins.if('*.css', plugins.autoprefixer(config.autoprefixer).pipe(plugins.csso()));
    });
}

function buildFrontMatterPipeline() {
  var counter = 0;

  return lazypipe()
    .pipe(plugins.if, '*.html', plugins.wrapper({
      header: function(file) {
        file.soyNamespace = 'temp' + counter++;
        return '{namespace ' + file.soyNamespace + '}\n' + getParamsDoc(file) + '{template .fm}\n';
      },
      footer: '\n{/template}'
    }))
    .pipe(plugins.if, '*.html', gulp.dest('dist'))
    .pipe(plugins.soynode, {
      loadCompiledTemplates: true,
      locales: config.defaultLocale ? [config.defaultLocale] : null,
      messageFilePathFormat: config.translationsFilepath
    })
    .pipe(plugins.ignore.exclude, '*.soy')
    .pipe(plugins.ignore.exclude, '*.soy.js')
    .pipe(plugins.if, '*.html', applyFrontMatterVariables());
}

function buildHtmlPipeline() {
  return lazypipe()
    .pipe(function() {
      return plugins.if('*.html', plugins.minifyHtml());
    });
}

function buildHtmlResourcePipeline() {
  return lazypipe()
    .pipe(plugins.usemin, {
      assetsDir: 'dist',
      css: ['concat'],
      js: ['concat']
    })
    .pipe(buildCssPipeline())
    .pipe(buildJavaScriptPipeline());
}

function buildJavaScriptPipeline() {
  return lazypipe()
    .pipe(function() {
      return plugins.if('*.js', plugins.uglify({
        preserveComments: 'some'
      }));
    });
}

function buildMarkdownPipeline() {
  return lazypipe()
    .pipe(function() {
      return plugins.if('*.md', plugins.markdown());
    });
}

function logError(err) {
  if (err.fileName) {
    gutil.log(gutil.colors.red('Error'), err.fileName, lookupErrorLine(err));
  } else if (err.message) {
    gutil.log(gutil.colors.red('Error'), err.message);
  } else {
    gutil.log(gutil.colors.red('Error'), err);
  }
}

function lookupErrorLine(err) {
  var line = '0';
  var position = '0';

  if (err.message) {
    var match = err.message.match(/line #?(\d+):?(\d+)?/i);
    if (match) {
      if (match[1]) {
        line = match[1];
      }
      if (match[2]) {
        position = match[2];
      }
    }
  }

  return line + ':' + position;
}

function applyFrontMatterVariables() {
  var soyEngine = new SoyTemplateEngine();

  return es.map(function(file, cb) {
    file.contents = new Buffer(soyEngine.render(
      file.soyNamespace + '.fm',
      file.frontMatter,
      config.defaultLocale
    ));
    cb(null, file);
  });
}

function getParamsDoc(file) {
  var content = file.contents.toString();
  var regex = new RegExp('{\\$([^{}]+)}', 'g');
  var matched;
  var paramsDoc = '';
  while (matched = regex.exec(content)) {
    paramsDoc += '@param ' + matched[1] + '\n';
  }

  return '/**\n' + paramsDoc + '**/\n';
}
