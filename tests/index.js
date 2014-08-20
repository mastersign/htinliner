var test = require('tape').test;
var fs = require('fs');
var File = require('vinyl');

var svginline = require('../src/index');

var strCount = function(haystack, needle) {
	var cnt = 0;
	var p = 0;
	while((p = haystack.indexOf(needle, p)) >= 0) {
		p = p + 1;
		cnt = cnt + 1;
	}
	return cnt;
};

test('svginline.inlineSvg()', function(t) {
	var srcPath = 'tests/data/doc.html';
	var text = fs.readFileSync(srcPath);

	var result = svginline.inlineSvg(text, srcPath);
	t.equals(strCount(result, '<html'), 1, 'one opening HTML tag');
	t.equals(strCount(result, '<body'), 1, 'one opening BODY tag');
	t.equals(strCount(result, '<svg'), 2, 'two opening SVG tags');
	t.equals(strCount(result, '</svg>'), 2, 'two closing SVG tags');
	t.equals(strCount(result, '</html'), 1, 'one closing HTML tag');
	t.end();
});

test('svginline() with buffer', function(t) {
	var f = new File({
		cwd: 'tests/',
		base: 'data/',
		path: 'data/doc.html',
		contents: fs.readFileSync('tests/data/doc.html')
	});

	var result = [];
	var svgi = svginline();
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
		t.equals(strCount(resultText, '<html'), 1, 'one opening HTML tag');
		t.equals(strCount(resultText, '<body'), 1, 'one opening BODY tag');
		t.equals(strCount(resultText, '<svg'), 2, 'two opening SVG tags');
		t.equals(strCount(resultText, '</svg>'), 2, 'two closing SVG tags');
		t.equals(strCount(resultText, '</html'), 1, 'one closing HTML tag');
		t.end();
	});
	svgi.write(f);
	svgi.end();
});
