import * as URL from 'url';
import * as _ from 'underscore';

var urlRegex = /((?:@import\s+)?url\s*\(['"]?)(\S*?)(['"]?\s*\))|(@import\s+['"]?)([^;'"]+)/ig;

export function processCSSURLs(str:string, url:string, frameId:CRI.FrameID, tabId:CRI.TabID):string {
	if(url) {
		return str.replace(urlRegex, (m, arg1, arg2, arg3, arg4, arg5) => {
						var specifiedURL = arg2 || arg5;
						var absoluteURL = URL.resolve(url, specifiedURL),
							relativeURL = URL.format({
								pathname: 'r',
								query: {
									l: absoluteURL,
									f: frameId,
									t: tabId
								}
							});
						return m.replace(specifiedURL, relativeURL);
					});
	} else {
		return str;
	}
}

export function parseCSS(cssStr:string, url:string, frameId:CRI.FrameID, tabId:CRI.TabID):string {
	return processCSSURLs(cssStr, url, frameId, tabId);
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
