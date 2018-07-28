var browserify = require('browserify');
var tsify = require('tsify');

browserify()
    .add('index.ts')
    .plugin('tsify', {
      noImplicitAny: true,
    })
    .bundle()
    .pipe(process.stdout);
