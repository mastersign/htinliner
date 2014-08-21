var test = require('tape').test;
var fs = require('fs');
var File = require('vinyl');
var cheerio = require('cheerio');

var inliner = require('../src/index');

var checkResult = function(resultStr, t) {
	var $ = cheerio.load(resultStr);
	t.ok($('html'), 'has HTML element');
	t.equals($('head link').length, 2, 'replace two of four links');
	t.equals($('head style').length, 2, 'replace two links with style elements');
	t.equals($('head script').length, 2, 'script tag in head still there');
	t.equals($('head script').attr('src'), undefined, 'src attribute from script tag removed');
	t.ok($('body'), 'has BODY element');
	t.equals($('html body svg').length, 2, 'inlined 2 svg images');
	t.equals($('html body span[class="htinliner"] svg').length, 2, 
		'wrapped svg in divs with class="htinliner"');
	t.ok($('#remoteimg'), 'kept image with remote URL');
	t.ok($('#nonsvgimg'), 'kept image with non SVG filename extension');
};

test('inliner(data, srcPath) with string', function(t) {
	var srcPath = 'tests/data/doc.html';
	var text = fs.readFileSync(srcPath, 'utf8');

	var result = inliner(text, srcPath);
	
	// console.log('=== DEBUG ===');
	// console.log(result);
	// console.log('=== DEBUG ===');
	
	checkResult(result, t);
	t.end();
});

test('inliner(text, srcPath, opt) with buffer', function(t) {
	var srcPath = 'tests/data/doc.html';
	var data = fs.readFileSync(srcPath);

	var result = inliner(data, srcPath, { encoding: 'utf8' });
	checkResult(result, t);
	t.end();
});

test('inliner() vinyl stream with buffer', function(t) {
	var f = new File({
		cwd: 'tests/',
		base: 'data/',
		path: 'data/doc.html',
		contents: fs.readFileSync('tests/data/doc.html')
	});

	var result = [];
	var svgi = inliner();
	var resultText;
	svgi.on('data', function(data) {
		t.ok(data instanceof File, 'result is Vinyl file');
		result.push(data);
	});
	svgi.on('end', function() {
		t.equals(result.length, 1, 'only one result');
		result = result[0];
		t.ok(result.contents, 'result is truthy');
		t.ok(result.contents instanceof Buffer, 'result is Buffer');
		resultText = result.contents.toString('utf8');
		checkResult(resultText, t);
		t.end();
	});
	svgi.write(f);
	svgi.end();
});
