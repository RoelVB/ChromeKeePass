const path = require('path');

module.exports = {
    entry: {
        background: './src/background.ts',
        content_script: './src/content_script.ts',
        popup: './src/popup.ts',
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
                test: /\.scss$/,
                use: [
                    'style-loader',
                    {
                        loader: 'typings-for-css-modules-loader',
                        options: {
                            namedExport: true,
                            modules: true,
                            sass: true,
                            url: false,
                            root: '',
                            sourceMap: process.env.npm_lifecycle_event!=='prod',
                            minimize: process.env.npm_lifecycle_event==='prod',
                        },
                    },
                    'sass-loader',
                ],
            },
            {
                exclude: /node_modules/,
                test: /\.ts$/,
                loader: 'ts-loader'
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.scss', '.js'],
        fallback: {
            'crypto': false
        },
    },
    devtool: process.env.npm_lifecycle_event!=='prod'?'inline-source-map':undefined,
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
};
