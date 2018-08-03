const browserify = require('browserify');
const tsify = require('tsify');
const fs = require('fs');

browserify()
    .add('index.ts')
    .plugin('tsify')
    .bundle()
    .pipe(fs.createWriteStream('index.js'));

browserify()
    .add('svg-path-tracer/demo.ts')
    .plugin('tsify')
    .bundle()
    .pipe(fs.createWriteStream('svg-path-tracer/demo.js'));
