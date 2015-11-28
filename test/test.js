/* globals require, describe, it */

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var cheerio = require('cheerio');

var inliner = require('../src/index');

var testDataPath = function (name) {
	return path.resolve(path.join('test/data', name));
};

var loadTextFile = function (path) {
	return fs.readFileSync(path, 'utf-8');
};

var checkResult = function(resultStr, svgSpanClass) {
	var $ = cheerio.load(resultStr);
	assert($('html'), 'has HTML element');
	assert.equal($('head link').length, 2, 'replace two of four links');
	assert.equal($('head style').length, 2, 'replace two links with style elements');
	assert.equal($('head script').length, 2, 'script tag in head still there');
	assert.equal($('head script').attr('src'), undefined, 'src attribute from script tag removed');
	assert($('body'), 'has BODY element');
	assert.equal($('html body svg').length, 2, 'inlined 2 svg images');
	assert.equal($('html body span[class="' + svgSpanClass +'"] svg').length, 2,
		'wrapped svg in divs with class="' + svgSpanClass + '"');
	assert($('#remoteimg'), 'kept image with remote URL');
	assert($('#nonsvgimg'), 'kept image with non SVG filename extension');
};

describe('htinliner', function () {

	describe('used as a function', function () {

		it('should inline the referenced files', function () {
			var sourcePath = testDataPath('doc.html');
			var source = loadTextFile(sourcePath);
			result = inliner(source, { sourcePath: sourcePath });
			checkResult(result, 'htinliner');
		});

	});

	describe('used as a function with options', function () {

		it('should inline the referenced files', function () {
			var sourcePath = testDataPath('doc.html');
			var source = loadTextFile(sourcePath);
			result = inliner(source, {
				sourcePath: sourcePath,
				svgWrapClass: 'my-test-class'
			});
			checkResult(result, 'my-test-class');
		});

	});

});
