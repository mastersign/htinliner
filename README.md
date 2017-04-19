# HTinliner

[![npm package][npm-img]][npm-url]
[![build status][travis-img]][travis-url]

> inlining linked CSS files, linked script files, and SVG images into HTML documents

## Usage

The _HTinliner_ can be used with [Gulp] or as an independent function.
It supports the following options:

* `inlineStylesheets`  
  a boolean indicating, that `<link rel="stylesheet" href="...">` tags should be replaced by a `<style>` tag with the referenced file content.
* `inlineScripts`  
  a boolean indicating, that `<script src="..."></script>` tags should be
  filled with the content of the referenced file.
* `inlineSvgImages`  
  a boolean indicating, that `<img src="...somthing.svg">` tags should be
  replaced by the SVG markup from the referenced image file.
* `basePath`  
  a file or folder name, which is used as base path for resolving the relative paths of the inlined files.
* `svgRemoveSize`  
  a boolean indicating, that the specified width and height should be removed
  from the SVG markup.
* `svgLimitSize`
  a boolean indicating, that the specified size, or if none given, the SVG element size,
  is copied to the CSS properties `max-width` and `max-height`.
* `svgWrap`  
  a boolean indicating, that the SVG markup should be wrapped in an additional
  HTML element, which is specified in the option `svgWrapElement`,
  and the CSS class specified in the option `svgWrapClass`.
* `svgWrapElement`  
  a string with the name of the HTML element, wrapping the inlined SVG markup.
* `svgWrapClass`  
  a string with the CSS class of the HTML element, wrapping the inlined SVG markup.

The default options are:

```js
{
    inlineStylesheets: true,
    inlineScripts: true,
    inlineSvgImages: true,
    basePath; null,
    svgRemoveSize: false,
    svgLimitSize: false,
    svgWrap: true,
    svgWrapElement: 'span',
    svgWrapClass: 'htinliner',
    throwOnNotFound: false
}
```

The inlining only takes place if the URL, referencing the stylesheet, script, or SVG image, is a relative URL.

If a `script` tag already has some content, than an aditional `script` tag
with the referenced script is inserted before the referencing tag
and the `src` attribute is removed from the referencing tag.

## Interface

_HTinliner_ provides its API with [GulpText _simple_][gulp-text-simple].

### Usage with Gulp

To use _HTinliner_ in [Gulp], it can be called with no or one argument:

`htinliner([options])`

where the optional argument represents the option object.

```js
var gulp = require('gulp');
var htinliner = require('htinliner');

gulp.task('default', function() {
    gulp.src('*.html', { cwd: 'src' })
        .pipe(htinliner({ inlineScripts: false }))
        .pipe(gulp.dest('standalone'));
});
```

### Usage as a function

To use _HTinliner_ as a function, it can be called with one or two arguments.

`htinliner(html, [options])`

* where the first argument `html` accepts a string with the HTML markup,
* the second argument `options` accepts a map with the attribute `sourceFile`,
which is the reference for the relative URLs in the HTML markup.

```js
var fs = require('fs');
var htinliner = require('htinliner');

var filename = 'src/example.html';
fs.readFile(filename, function(err, data) {
    if (err) { throw err; }

    var result = htinliner(data, { sourcePath: filename });

    fs.writeFile('standalone.html', result, function(err, data) {
        if (err) { throw err; }
    });
}, 'utf-8');
```

### Transform a file directly

To use _HTinliner_ to transform an HTML file directly, use the function `.readFileSync(path, [options)`.

``` js
var htinliner = require('htinline');

var filename = 'src/example.html';
var result = htinliner.readFileSync(filename);
```

## License

_HTinliner_ is published under the MIT license.

[npm-url]: https://www.npmjs.com/package/htinliner
[npm-img]: https://img.shields.io/npm/v/htinliner.svg
[travis-img]: https://img.shields.io/travis/mastersign/htinliner/master.svg
[travis-url]: https://travis-ci.org/mastersign/htinliner
[Gulp]: http://gulpjs.com
[gulp-text-simple]: https://www.npmjs.com/package/gulp-text-simple
