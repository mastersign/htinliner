var through = require('through2');
var path = require('path');
var fs = require('fs');
var url = require('url');
var cheerio = require('cheerio');

var defOpt = { 
	inlineStylesheets: true,
	inlineScripts: true,
	inlineSvgImages: true,
	svgRemoveSize: false,
	svgWrap: true,
	svgWrapElement: 'span',
	svgWrapClass: 'htinliner'
};

var option = function(name, opt) {
	return opt ? (opt[name] || defOpt[name]) : defOpt[name];
};

var fixLengthUnit = function(value, defUnit) {
	if (!value) { return value; }
	value = value.trim();
	return value.match(/^\d+$/) ? (value + (defUnit || 'px')) : value;
};

var fixSvgSize = function(svgSource, remove, width, height) {
	var $ = cheerio.load(svgSource, { xmlMode: true });
	var svg = $('svg');
	width = fixLengthUnit(width);
	height = fixLengthUnit(height);
	if (remove) {
		svg.removeAttr('width');
		svg.removeAttr('height');
		svg.css('width', null);
		svg.css('height', null);
	} else {
		if (width) {
			svg.css('width', width);
		} else if (!svg.css('width')) {
			svg.css('width', fixLengthUnit(svg.attr('width')));
		}
		if (height) {
			svg.css('height', height);
		} else if (!svg.css('height')) {
			svg.css('height', fixLengthUnit(svg.attr('height')));
		}
		svg.removeAttr('width');
		svg.removeAttr('height');
	}
	return $.xml('svg');
};

var getPathFromUrl = function(src, ext) {
	var srcUrl;
	if (!src) return null;
	srcUrl = url.parse(src);
	if (!srcUrl ||
		srcUrl.protocol ||
		!srcUrl.pathname ||
		(ext && srcUrl.pathname.slice(-4).toLowerCase() !== ext)) { 

		return null;
	}
	return srcUrl.pathname;
};

var inline = function(htmlSource, sourcePath, opt) {
	var $;
	var buildSrcPath = function(src) {
		return path.resolve(path.dirname(sourcePath), src);
	};
	sourcePath = sourcePath || '.';
	if (htmlSource instanceof Buffer) {
		htmlSource = htmlSource.toString(option('encoding', opt));
	}
	$ = cheerio.load(htmlSource);

	if (option('inlineStylesheets', opt)) {
		$('link[rel="stylesheet"]', 'head').each(function(i, elem) {
			var src = getPathFromUrl($(elem).attr('href'));
			var styleDoc, styleTag, typeAttr;
			var styleSource;
			if (!src) return;
			styleDoc = cheerio.load('<style></style>');
			styleTag = styleDoc('style');
			typeAttr = $(elem).attr('type');
			if (typeAttr) {
				styleTag.attr('type', typeAttr);
			}
			styleSource = fs.readFileSync(buildSrcPath(src), 'utf8');
			styleTag.append('\n' + styleSource);
			$(elem).replaceWith(styleDoc.html());
		});
	}
	if (option('inlineScripts', opt)) {
		$('script').each(function(i, elem) {
			var src = getPathFromUrl($(elem).attr('src'));
			var scriptDoc, scriptTag;
			var scriptSource;
			if (!src) return;
			scriptSource = fs.readFileSync(buildSrcPath(src), 'utf8');
			scriptDoc = cheerio.load('<script></script>');
			scriptTag = scriptDoc('script');
			scriptTag.append('\n' + scriptSource);
			scriptTag.attr('type', $(elem).attr('type'));
			scriptTag.attr('language', $(elem).attr('language'));
			if ($(elem).contents().length > 0) {
				$(elem).removeAttr('src');
				$(elem).before(scriptDoc.html());
			} else {
				$(elem).replaceWith(scriptDoc.html());
			}
		});
	}
	if (option('inlineSvgImages', opt)) {
		$('img', 'body').each(function(i, elem) {
			var src = getPathFromUrl($(elem).attr('src'), '.svg');
			var width = $(elem).css('width') || $(elem).attr('width');
			var height = $(elem).css('height') || $(elem).attr('height');
			var svgData, svgSource;
			var prefix, postfix;
			if (!src) return;
			svgData = fs.readFileSync(buildSrcPath(src));
			svgSource = fixSvgSize(svgData, option('svgRemoveSize', opt), width, height);
			if (option('svgWrap', opt)) {
				prefix = '<' + option('svgWrapElement', opt) + ' class="' +
					option('svgWrapClass', opt) + '">';
				postfix = '</' + option('svgWrapElement', opt) + '>';
			} else {
				prefix = '';
				postfix = '';
			}
			$(elem).replaceWith(prefix + svgSource + postfix);
		});
	}
	return $.xml();
};

var htinliner = function() {
	if (arguments.length > 0 && 
		(typeof(arguments[0]) === 'string' ||
		 arguments[0] instanceof Buffer)) {
		return inline(arguments[0], arguments[1], arguments[2]);
	}
	var opt = arguments[0];
	return through.obj(function(file, enc, cb) {
		var sourcePath = path.resolve(file.cwd, file.path);
		var sourceHtml;
		if (file.isNull()) {
			// pass
			this.push(file);
			cb();
		} else if (file.isBuffer()) {
			sourceHtml = file.contents;
			file.contents = new Buffer(inline(sourceHtml, sourcePath, opt));
			this.push(file);
			cb();
		} else if (file.isStream()) {
			throw 'Streams are currently not supported.';
		}
	});
};

module.exports = htinliner;
