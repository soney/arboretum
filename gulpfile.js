const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const ts = require('gulp-typescript');
const tsProject = ts.createProject("tsconfig.json");
const webpack = require('webpack-stream');
const _ = require('underscore');

const {outDir} = tsProject.options;
const {sourceRoot} = tsProject.config.compilerOptions;
const webpackCommonConfig = {
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }, {
            test: /\.less$/,
            use: [{
                loader: "style-loader" // creates style nodes from JS strings
            }, {
                loader: "css-loader" // translates CSS into CommonJS
            }, {
                loader: "less-loader" // compiles Less to CSS
            }]
        }, {
            test: /\.(png|svg|jpg|gif|woff|woff2|eot|ttf|otf)$/,
            use: [
                'file-loader'
            ]
        }, {
            test: /\.(html)$/,
            use: {
                loader: 'html-loader',
                options: {
                    attrs: [':data-src']
                }
            }
        }]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', 'html', 'htm']
    },
};

const clientWebpackConfig = _.extend({
    entry: path.join(__dirname, 'src', 'client', 'client_main.ts'),
    output: {
        filename: 'client_bundle.js',
        path: path.resolve(__dirname, 'built', 'client')
    }
}, webpackCommonConfig);
const browserWebpackConfig = _.extend({
    entry: path.join(__dirname, 'src', 'browser', 'browser_main.ts'),
    output: {
        filename: 'browser_bundle.js',
        path: path.resolve(__dirname, 'built', 'browser')
    }
}, webpackCommonConfig);

// =======
// CLIENT
// =======
gulp.task('client-webpack', function() {
    return gulp.src(clientWebpackConfig.entry)
                .pipe(webpack(clientWebpackConfig))
                .pipe(gulp.dest(clientWebpackConfig.output.path));
});
gulp.task('client-webpack-watch', function() {
    return gulp.src(clientWebpackConfig.entry)
                .pipe(webpack(_.extend({
                    watch: true
                }, clientWebpackConfig)))
                .pipe(gulp.dest(clientWebpackConfig.output.path));
});
gulp.task('client-resources', function() {
    return gulp.src(path.join(__dirname, 'src', 'client', '**/*.{html,htm,css,js,woff,ttf,png}'))
        .pipe(gulp.dest(path.join(__dirname, 'built', 'client')));
});
gulp.task('client-resources-watch', function() {
    return gulp.watch([path.join(__dirname, 'src', 'client', '**/*.{html,htm,css,js,woff,ttf,png}')], ['client-resources']);
});
gulp.task('client', ['client-webpack', 'client-resources']);
gulp.task('client-watch', ['client-webpack-watch', 'client-resources-watch']);

// =======
// BROWSER
// =======
gulp.task('browser-webpack', function() {
    return gulp.src(browserWebpackConfig.entry)
                .pipe(webpack(browserWebpackConfig))
                .pipe(gulp.dest(browserWebpackConfig.output.path));
});
gulp.task('browser-webpack-watch', function() {
    return gulp.src(browserWebpackConfig.entry)
                .pipe(webpack(_.extend({
                    watch: true
                }, browserWebpackConfig)))
                .pipe(gulp.dest(browserWebpackConfig.output.path));
});
gulp.task('browser-resources', function() {
    return gulp.src(path.join(__dirname, 'src', 'browser', '**/*.{html,htm,css,js,woff,ttf,png}'))
        .pipe(gulp.dest(path.join(__dirname, 'built', 'browser')));
});
gulp.task('browser-resources-watch', function() {
    return gulp.watch([path.join(__dirname, 'src', 'browser', '**/*.{html,htm,css,js,woff,ttf,png}')], ['browser-resources']);
});
gulp.task('browser', ['browser-webpack', 'browser-resources']);
gulp.task('browser-watch', ['browser-webpack-watch', 'browser-resources-watch']);

// ======
// SERVER
// ======

gulp.task('server-resources', function() {
    return gulp.src(path.join(__dirname, 'src', 'server', '**/*.{html,htm,css,js,woff,ttf,png}'))
        .pipe(gulp.dest(path.join(__dirname, 'built', 'server')));
});
gulp.task('server-ts', function() {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest(outDir));
});
gulp.task('server', ['server-ts', 'server-resources']);
gulp.task('server-watch', function() {
    return gulp.watch([path.join(__dirname, 'src', '*.ts'), path.join(__dirname, 'src', 'server', '**/*.{html,htm,css,js,woff,ttf,png,ts}')], ['server-ts', 'server-resources']);
});


gulp.task('default', ['server', 'browser', 'client']);
gulp.task('watch', ['server-watch', 'browser-watch', 'client-watch']);
