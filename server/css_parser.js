var css = require('css'),
	URL = require('url'),
	_ = require('underscore');

var urlRegex = /((?:@import\s+)?url\s*\(['"]?)(\S*?)(['"]?\s*\))|(@import\s+['"]?)([^;'"]+)/ig;

function processCSSURLs(str, url) {
	return str.replace(urlRegex, function(m, arg1, arg2, arg3) {
					var absoluteURL = URL.resolve(url, arg2),
						relativeURL = URL.format({
							pathname: 'r',
							query: {
								l: absoluteURL
							}
						});
					return m.replace(arg2, relativeURL);
				});
}

function parseCSS(cssStr, url) {
	var ast = css.parse(cssStr);
	if(ast.type === 'stylesheet') {
		_.each(ast.stylesheet.rules, function(rule) {
			_.each(rule.declarations, function(declaration) {
				var value = declaration.value;
				declaration.value = processCSSURLs(value, url);
			});
		});

		var stringifiedCSS = css.stringify(ast);

		return stringifiedCSS;
	} else {
		return cssStr;
	}
}

module.exports = {
	parseCSS: parseCSS,
	processCSSURLs: processCSSURLs
};