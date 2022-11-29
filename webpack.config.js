const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const devMode = process.env.npm_lifecycle_event !== 'prod';

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
                    MiniCssExtractPlugin.loader,
                    '@teamsupercell/typings-for-css-modules-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            url: false,
                            sourceMap: devMode,
                        }
                    },
                    'sass-loader',
                ],
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
    devtool: devMode ? 'inline-source-map' : undefined,
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
    optimization: {
        minimizer: [
            `...`,
            new CssMinimizerPlugin(),
        ],
    },
};
