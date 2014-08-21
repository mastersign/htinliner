# HTinliner

Inlines linked CSS files, linked script files, and SVG images into HTML documents.

Author: Tobias Kiertscher <dev@mastersign.de>

License: MIT

## Usage

The HTinliner can be used in *Gulp* or as an independent function.
It supports the following options:

* `inlineStylesheets`  
  a boolean indicating, that `<link rel="stylesheet" href="...">` tags should be replaced by a `<style>` tag with the referenced file content.
* `inlineScripts`  
  a boolean indicating, that `<script src="..."></script>` tags should be
  filled with the content of the referenced file.
* `inlineSvgImages`  
  a boolean indicating, that `<img src="...somthing.svg">` tags should be
  replaced by the SVG markup from the referenced image file.
* `svgRemoveSize`  
  a boolean indicating, that the specified width and height should be removed
  from the SVG markup.
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
    svgRemoveSize: false,
    svgWrap: true,
    svgWrapElement: 'span',
    svgWrapClass: 'htinliner'
}
```

The inlining only takes place if the URL, referencing the stylesheet, script, or SVG image, is a relative URL. 

If a `script` tag already has some content, than an aditional `script` tag
with the referenced script is inserted before the referencing tag 
and the `src` attribute is removed from the referencing tag.

### Usage in Gulp

To use HTinliner in Gulp, it can be called with no or one argument:

`htinliner([opt])`

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

### Usage as an independent function

To use HTinliner as an independent function, it can be called with
two or three arguments.

`htinliner(data, basePath[, opt])`

* where the first argument `data` accepts a string with the HTML markup or a `Buffer` object, 
* the second argument `basePath` accepts a string with the file or foldername
which is the reference for the relative URLs in the HTML markup,
* and the optional third argument represents the option object.

```js
var fs = require('fs');
var htinliner = require('htinliner');

var filename = 'src/example.html';
fs.readFile(filename, function(err, data) {
    if (err) { throw err; }

    var result = htinliner(data, filename);

    fs.writeFile('standalone.html', result, function(err, data) {
        if (err) { throw err; }
    });
});
```
