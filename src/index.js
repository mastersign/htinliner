var through = require('through2');
var path = require('path');
var fs = require('fs');

var removeSize = function(svgSource) {
	var widthPattern = /<svg([^>]*?)\swidth\s*=\s*(["'])([^\2]*?)\2([^>]*?)>/
	var heightPattern = /<svg([^>]*?)\sheight\s*=\s*(["'])([^\2]*?)\2([^>]*?)>/
	var m;
	var replFn = function(match, pre, _, _, post) {
		return '<svg' + pre + post + '>'
	};
	svgSource = svgSource.replace(widthPattern, replFn);
	svgSource = svgSource.replace(heightPattern, replFn);
	return svgSource;
};

var inline = function(htmlSource, sourcePath) {
	var imgPattern = /<img(\s+|\s.*?\s)src\s*=\s*(["'])([^\2]*?)\2(.*?)>/g;
	var buildSrcPath = function(src) {
		return path.resolve(path.dirname(sourcePath), src);
	};
	if (htmlSource instanceof Buffer) {
		htmlSource = htmlSource.toString();
	}
	return htmlSource.replace(imgPattern, function(match, pre, _, src, post) {
		return '<div class="svginline">' +
			removeSize(fs.readFileSync(buildSrcPath(src), 'utf8')) +
			'</div>';
	});
};

var svginline = function() {
	return through.obj(function(file, enc, cb) {
		var sourcePath = path.resolve(file.cwd, file.path);
		if (file.isNull()) {
			// pass
			this.push(file);
			cb();
		} else if (file.isBuffer()) {
			// extract asynchronously
			file.contents = new Buffer(inline(file.contents.toString(enc), sourcePath));
			this.push(file);
			cb();
		} else if (file.isStream()) {
			throw 'Streams are currently not supported.';
		}
	});
};

svginline.inlineSvg = inline;
module.exports = svginline;
