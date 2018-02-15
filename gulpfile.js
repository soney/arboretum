const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const ts = require('gulp-typescript');
const tsProject = ts.createProject("tsconfig.json");
const webpack = require('webpack-stream');

const {outDir} = tsProject.options;
const {sourceRoot} = tsProject.config.compilerOptions;
const tsSources = [path.join(sourceRoot, '**/*.{ts}'), '!'+path.join(sourceRoot, 'client', 'client_pages', '**/*')];
const webSources = [path.join(sourceRoot, '**/*.{html, htm, css,js,woff,ttf}')];

gulp.task('client-pages', function() {
    return gulp.src(path.join(sourceRoot, 'client', 'client_pages', 'main.ts')).pipe(webpack({
        devtool: 'source-map',
        entry: path.join(__dirname, 'src', 'client', 'client_pages', 'main.ts'),
        module: {
            rules: [{
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }]
        },
        resolve: {
            extensions: [ '.tsx', '.ts', '.js' ]
        },
        output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, 'built', 'client', 'client_pages')
        }
    })).pipe(gulp.dest(path.resolve(__dirname, 'built', 'client', 'client_pages')));
});

gulp.task('ts', function() {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest(outDir));
});
gulp.task('web', function() {
    return gulp.src(webSources)
        .pipe(gulp.dest(outDir));
});

gulp.task('watch', ['ts', 'web', 'client-pages'], function() {
    return gulp.watch([path.join(sourceRoot, '**/*')], ['ts', 'web', 'client-pages']);
});

gulp.task('default', ['ts', 'web', 'client-pages']);
