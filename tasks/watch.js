'use strict';

var gulp = require('gulp');
var config = require('./lib/ProductFlavors').generateFlavoredConfig();

gulp.task('watch', ['serve'], function(done) {
  gulp.watch('src/**', ['build-copy']);
  gulp.watch(config.globHtml, ['build-html']);
  gulp.watch(config.globIcon, ['build-icons']);
  gulp.watch(config.globImage, ['build-images']);
  gulp.watch(config.globMarkdown, ['build-markdown']);
  gulp.watch(config.globScript, ['build-scripts']);
  gulp.watch(config.globScss, ['build-compass']);
  gulp.watch(config.globStyle, ['build-styles']);
  gulp.watch(config.globTemplate, ['build-templates']);

  if (config.translationsFilepath) {
    gulp.watch(config.translationsFilepath.replace('{LOCALE}', '*'), ['build-templates']);
  }
});
