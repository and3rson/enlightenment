var gulp = require('gulp'),
    watch = require('gulp-watch'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    source = require('vinyl-source-stream'),
    stringify = require('stringify'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename');

gulp.task('browserify', () => {
    return browserify({
        'entries': ['src/main.js'],
        debug: true
    })
    .transform(babelify, {
        presets: ['es2015'],
        sourceMaps: false
    })
    .transform(stringify, {
        appliesTo: {
            includeExtensions: ['.frag']
        },
        minify: false
    })
    .bundle()
    .pipe(source('enlightenment.js')) // gives streaming vinyl file object
    .pipe(gulp.dest('./dist'));
});

gulp.task('uglify', ['browserify'], () => {
    return gulp
    .src('dist/enlightenment.js')
    .pipe(uglify({
        fileName: 'enlightenment.min.js'
    }))
    .pipe(rename({
        extname: '.min.js'
    }))
    .pipe(gulp.dest('./dist'))
    ;
});

gulp.task('build', ['browserify', 'uglify']);

gulp.task('watch', () => {
    gulp.watch(['./index.html', './src/*', './example/*'], ['build']);
});
