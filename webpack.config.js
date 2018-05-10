const path = require('path');

module.exports = {
    entry: ['./js/tableau_conn.js'],
    mode:  "development" ,// "none"
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
};
