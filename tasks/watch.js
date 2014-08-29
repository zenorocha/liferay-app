'use strict';

var fs = require('fs');
var gulp = require('gulp');
var path = require('path');
var AppEvents = require('./lib/AppEvents');
var config = require('./lib/ProductFlavors').generateFlavoredConfig();

gulp.task('watch', ['serve'], function(cb) {
  gulp.watch('src/**', function(event) {
    var distPath = path.join(
      'dist',
      path.relative(path.join(process.cwd(), 'src'), event.path)
    );

    if (event.type == 'deleted') {
      fs.unlink(distPath);
    }
    else {
      gulp.src(event.path)
        .pipe(gulp.dest(path.dirname(distPath)));
    }
  });

  gulp.watch(config.globHtml, ['build-html']);
  gulp.watch(config.globIcon, ['build-icons']);
  gulp.watch(config.globImage, ['build-images']);
  gulp.watch(config.globMarkdown, ['build-markdown']);
  gulp.watch(config.globScript, ['build-scripts']);
  gulp.watch(config.globScss, ['build-compass']);
  gulp.watch(config.globStyle, ['build-styles']);
  gulp.watch(config.globTemplate, ['build-templates']);
  gulp.watch(config.translationsFilepath.replace('{LOCALE}', '*'), ['build-templates']);

  gulp.watch('dist/routes.txt', function() {
    AppEvents.emit('routesChange');
  });
  gulp.watch('dist/**/*.js', function() {
    AppEvents.emit('scriptsChange');
  });
});
