const path = require('path');

module.exports = {
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
};
