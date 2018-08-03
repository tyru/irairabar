const browserify = require('browserify');
const tsify = require('tsify');
const fs = require('fs');

browserify()
    .add('index.ts')
    .plugin('tsify')
    .bundle()
    .pipe(fs.createWriteStream('index.js'));
