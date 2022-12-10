module.exports = {
    entry: './src/index.js',
    mode: 'production',
    output: {
        path: __dirname + '/dist',
        publicPath: '/',
        filename: 'bundle.js',
        library: 'MathTex',
        libraryTarget: 'umd'
    }
};
