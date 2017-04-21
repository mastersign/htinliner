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

var checkResult = function(resultStr, wrapped, svgWrapElement, svgWrapClass) {
	var $ = cheerio.load(resultStr);
	assert($('html'), 'has HTML element');
	assert.equal($('head link').length, 2, 'replace two of four links');
	assert.equal($('head style').length, 2, 'replace two links with style elements');
	assert.equal($('head script').length, 2, 'script tag in head still there');
	assert.equal($('head script').attr('src'), undefined, 'src attribute from script tag removed');
	assert($('body'), 'has BODY element');
	assert.equal($('html body p svg').length, 2, 'inlined 2 svg images');
	if (wrapped)	{
		if (svgWrapClass) {
			assert.equal($('html body p > ' + svgWrapElement + '[class="' + svgWrapClass +'"] > svg').length, 2,
				'wrapped svg in ' + svgWrapElement + 's with class="' + svgWrapClass + '"');
		} else {
			assert.equal($('html body p > ' + svgWrapElement + ' > svg').length, 2,
				'wrapped svg in ' + svgWrapElement + 's');
			assert.equal($('html body p > ' + svgWrapElement + '[class] > svg').length, 0,
				'wrapped svg in ' + svgWrapElement + 's without a class');
		}
	} else {
		assert.equal($('html body p > svg').length, 2,
			'svg not wrapped in ' + svgWrapElement);
	}
	assert($('#remoteimg'), 'kept image with remote URL');
	assert($('#nonsvgimg'), 'kept image with non SVG filename extension');
};

describe('htinliner', function () {

	describe('used as a function', function () {

		it('should inline the referenced files', function () {
			var sourcePath = testDataPath('doc.html');
			var source = loadTextFile(sourcePath);
			var result = inliner(source, { sourcePath: sourcePath });
			checkResult(result, true, 'span', 'htinliner');
		});

	});

	describe('used as a function with options', function () {

		it('should inline the referenced files, svg wrapped in span with custom class', function () {
			var sourcePath = testDataPath('doc.html');
			var source = loadTextFile(sourcePath);
			var result = inliner(source, {
				sourcePath: sourcePath,
				svgWrapClass: 'my-test-class'
			});
			checkResult(result, true, 'span', 'my-test-class');
		});

		it('should inline the referenced files, svg wrapped in div without class', function () {
			var sourcePath = testDataPath('doc.html');
			var source = loadTextFile(sourcePath);
			var result = inliner(source, {
				sourcePath: sourcePath,
				svgWrap: true,
				svgWrapElement: 'div',
				svgWrapClass: null
			});
			checkResult(result, true, 'div', null);
		});

		it('should inline the referenced files, svg not wrapped', function () {
			var sourcePath = testDataPath('doc.html');
			var source = loadTextFile(sourcePath);
			var result = inliner(source, {
				sourcePath: sourcePath,
				svgWrap: false,
				svgWrapElement: 'div',
				svgWrapClass: 'my-test-class'
			});
			checkResult(result, false, 'div', 'my-test-class');
		});

	});

});
