/* globals require */

var path = require('path');
var fs = require('fs');
var url = require('url');
var cheerio = require('cheerio');
var textTransformation = require('gulp-text-simple');

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
	var $ = cheerio.load(svgSource, { xmlMode: true,  decodeEntities: false });
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
	var basePath = fs.lstatSync(sourcePath).isDirectory() ?
		sourcePath : path.dirname(sourcePath);
	var buildSrcPath = function(src) {
		return path.resolve(basePath, src);
	};
	var svgs = {};
	var svgId;
	var cnt = 0;
	var result;
	sourcePath = sourcePath || '.';
	if (htmlSource instanceof Buffer) {
		htmlSource = htmlSource.toString(option('encoding', opt));
	}
	$ = cheerio.load(htmlSource, { xmlMode: false, decodeEntities: false });

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
			var replaceId = 'htinliner_svg_id_' + cnt;
			cnt = cnt + 1;
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
			svgs[replaceId] = prefix + svgSource + postfix;
			$(elem).replaceWith(replaceId);
		});
	}
	result = $.html();
	for (svgId in svgs) {
		result = result.replace(svgId, svgs[svgId]);
	}
	return result;
};

var htinliner = textTransformation(function (text, options) {
	var sourcePath = (options && options.sourcePath) ? options.sourcePath : './unknown';
	return inline(text, sourcePath, options);
});

module.exports = htinliner;
