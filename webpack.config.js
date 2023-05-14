const webpack = require('webpack');
const path = require('path');

module.exports = (env, argv) => ({
    entry: {
        background: './src/background.ts',
        content_script: './src/content_script.ts',
        toolbarPopup: './src/popup.ts',
        options: './src/options.ts',
        credentialSelector: './src/credentialSelector.ts',
    },
    output: {
        path: path.resolve(__dirname, 'dist/js'),
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.tsx?$/,
                loader: 'ts-loader'
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        fallback: {
            'crypto': false
        },
    },
    plugins: [
        new webpack.DefinePlugin({
            DEBUG: (argv.mode!=='production'),
            VERSION: JSON.stringify(require("./dist/manifest.json").version),
        }),
    ],
    devtool: argv.mode!=='production'?'inline-source-map':undefined,
    performance: {
        hints: false,
    },
    stats: {
        builtAt: true,
        chunks: false,
        chunkModules: false,
        chunkOrigins: false,
        modules: false,
        entrypoints: false,
    },
});
