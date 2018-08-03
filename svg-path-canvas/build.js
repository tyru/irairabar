const browserify = require('browserify');
const tsify = require('tsify');
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'demo/circle-camera/index.ts');
const dest = path.join(__dirname, 'demo/circle-camera/index.js');
browserify()
    .add(src)
    .plugin('tsify')
    .bundle()
    .pipe(fs.createWriteStream(dest));
