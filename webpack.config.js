const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: {
        background: './src/background.ts',
        content_script: './src/content_script.ts',
        popup: './src/popup.ts',
        options: './src/options.ts',
        credentialSelector: './src/credentialSelector.ts',
    },
    plugins: [new MiniCssExtractPlugin()],
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
                    {
                        loader: 'style-loader',
                        options: {
                            convertToAbsoluteUrls: false,
                            transform: './styleTransform.js',
                        },
                    },
                    '@teamsupercell/typings-for-css-modules-loader',
                    process.env.npm_lifecycle_event === 'prod' ? MiniCssExtractPlugin.loader : null,
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            url: false,
                            sourceMap: process.env.npm_lifecycle_event !== 'prod',
                        }
                    },
                    'sass-loader',
                ].filter(loader => loader !== null),
            },
            {
                exclude: /node_modules/,
                test: /\.ts$/,
                loader: 'ts-loader'
            },
            {
                test: /\.svg$/,
                loader: 'svg-inline-loader',
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.scss', '.js'],
        fallback: {
            'crypto': false
        },
    },
    devtool: process.env.npm_lifecycle_event !== 'prod' ? 'inline-source-map' : undefined,
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
