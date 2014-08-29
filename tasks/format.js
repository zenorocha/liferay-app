'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var merge = require('merge-stream');
var util = require('./lib/util');
var config = require('./lib/ProductFlavors').generateFlavoredConfig();

gulp.task('format-scripts', function() {
  var scripts = gulp.src(config.globScript)
    .pipe(plugins.plumber(util.logError))
    .pipe(plugins.esformatter())
    .pipe(gulp.dest('src/public'));

  var tasks = gulp.src(['tasks/**/*.js'])
    .pipe(plugins.plumber(util.logError))
    .pipe(plugins.esformatter())
    .pipe(gulp.dest('tasks'));

  var tests = gulp.src('test/**/*.js')
    .pipe(plugins.plumber(util.logError))
    .pipe(plugins.esformatter())
    .pipe(gulp.dest('test'));

  return merge(scripts, tasks, tests);
});

gulp.task('format-styles', function() {
  var styles = gulp.src(config.globStyle)
    .pipe(plugins.plumber(util.logError))
    .pipe(plugins.csscomb())
    .pipe(plugins.cssbeautify({
      indent: '  '
    }))
    .pipe(gulp.dest('src/public'));

  var scss = gulp.src(config.globScss)
    .pipe(plugins.plumber(util.logError))
    .pipe(plugins.csscomb())
    .pipe(plugins.cssbeautify({
      indent: '  '
    }))
    .pipe(gulp.dest('src/public/styles'));

  return merge(styles, scss);
});

gulp.task('format', ['format-scripts', 'format-styles']);
