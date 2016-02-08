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
	return processCSSURLs(cssStr, url);
	/*
	try {
		var ast = css.parse(cssStr);

		if(ast.type === 'stylesheet') {
			_.each(ast.stylesheet.rules, function(rule) {
				_.each(rule.declarations, function(declaration) {
					if(declaration.type === 'declaration') {
						var value = declaration.value;
						console.log(value);
						if(value === '#333333 url(../images/bg-subcontent.jpg) 0 0 repeat-x') {
							console.log(value);
						}
						declaration.value = processCSSURLs(value, url);
					}
				});
			});

			var stringifiedCSS = css.stringify(ast);

			return stringifiedCSS;
		} else {
			return cssStr;
		}
	} catch(err) {
		return processCSSURLs(cssStr, url);
		//console.log(cssStr);
		//return cssStr;
	}
	*/
}

module.exports = {
	parseCSS: parseCSS,
	processCSSURLs: processCSSURLs
};