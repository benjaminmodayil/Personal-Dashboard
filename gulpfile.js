var gulp = require('gulp'),
  sass = require('gulp-sass'),
  runSequence = require('run-sequence')

gulp.task('sass', function() {
  return gulp
    .src('scss/**/*.scss')
    .pipe(sass()) // Using gulp-sass
    .pipe(gulp.dest('public/stylesheets'))
})

gulp.task('watch', ['sass'], function() {
  gulp.watch('scss/**/*.scss', ['sass'])
  // Other watchers
  // gulp.watch('app/js/**/*.js', browserSync.reload)
})

gulp.task('default', function(callback) {
  runSequence(['sass', 'watch'], callback)
})
