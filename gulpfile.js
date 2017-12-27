const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const ts = require('gulp-typescript');
const tsProject = ts.createProject("tsconfig.json");

const {outDir} = tsProject.options;
const {sourceRoot} = tsProject.config.compilerOptions;
const tsSources = path.join(sourceRoot, '**/*.{ts}');
const webSources = path.join(sourceRoot, '**/*.{html,htm,css,js,woff,ttf}');

gulp.task('ts', function() {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest(outDir));
});
gulp.task('web', function() {
    return gulp.src(webSources)
        .pipe(gulp.dest(outDir));
});

gulp.task('watch', ['ts', 'web'], function() {
    return gulp.watch([path.join(sourceRoot, '**/*')], ['ts', 'web']);
});


gulp.task('default', ['ts', 'web']);