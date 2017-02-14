var gulp = require('gulp'),
    watch = require('gulp-watch'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    source = require('vinyl-source-stream'),
    stringify = require('stringify');

gulp.task('build', () => {
        return browserify({
            'entries': ['src/main.js'],
            debug: true
        })
        .transform(babelify, {
            presets: ['es2015']
        })
        .transform(stringify, {
            appliesTo: {
                includeExtensions: ['.frag']
            },
            minify: true
        })
        .bundle()
        .pipe(source('enlightenment.js')) // gives streaming vinyl file object
        .pipe(gulp.dest('./dist'))
    ;
});

gulp.task('watch', () => {
    gulp.watch(['./src/*', './example/*'], ['build']);
});
