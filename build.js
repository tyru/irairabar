var browserify = require('browserify');
var tsify = require('tsify');

browserify()
    .add('index.ts')
    .plugin('tsify')
    .bundle()
    .pipe(process.stdout);
