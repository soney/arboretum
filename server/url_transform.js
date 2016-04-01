//http://stackoverflow.com/questions/2725156/complete-list-of-html-tag-attributes-which-have-a-url-value
var URL = require('url'),
	srcset = require('srcset'),
	_ = require('underscore');

var TRANSFORM = 'transform',
	REFORMAT = 'reformat';

var containsURLs = {
	'a': {
		'href': {
			strategy: REFORMAT,
			transform: function(url, baseURL, node) {
				return 'javascript:void(0);';
			}
		}
	},

	'body': {
		'background': {
			strategy: TRANSFORM,
			transform: transformURL
		}
	},
	/*

	'iframe': {
		'src': {
			strategy: TRANSFORM,
			transform: function(url, baseURL, node) {
				var childFrame = node.getChildFrame();
				if(childFrame) {
					return URL.format({
						pathname: 'f',
						query: {
							i: childFrame.getFrameId()
						}
					});
				} else {
					log.error('No child frame');
				}
			}
		},
	},
	*/

	'img': {
		'src': {
			strategy: TRANSFORM,
			transform: transformURL
		},
		'srcset': {
			strategy: TRANSFORM,
			transform: transformSRCSet
		}
	},

	'source': {
		'src': {
			strategy: TRANSFORM,
			transform: transformURL
		},
		'srcset': {
			strategy: TRANSFORM,
			transform: transformSRCSet
		},
		'data-srcset': {
			strategy: TRANSFORM,
			transform: transformSRCSet
		}
	},

	'link': {
		'href': {
			strategy: TRANSFORM,
			transform: transformURL
		}
	},

	'object': {
		'src': {
			strategy: TRANSFORM,
			transform: transformURL
		},
		'data': {
			strategy: TRANSFORM,
			transform: transformURL
		}
	},

	'form': {
		'action': {
			strategy: REFORMAT,
			transform: makeBlank
		},
		'method': {
			strategy: REFORMAT,
			transform: makeBlank
		}
	}
};

function makeBlank() {
	return '';
}

function transformSRCSet(attrVal, baseURL, node, shadow) {
	var parsed = srcset.parse(attrVal);
	_.each(parsed, function(p) {
		p.url = transformURL(p.url, baseURL, node, shadow);
	});
	return srcset.stringify(parsed);
}

function transformURL(url, baseURL, node, shadow) {
	var absoluteURL = URL.resolve(baseURL, url),
		relativeURL = URL.format({
			pathname: 'r',
			query: {
				u: shadow.getUserId(),
				t: node.getTabId(),
				f: node.getFrameId(),
				l: absoluteURL
			}
		});

	return relativeURL;
}

module.exports = {
	urlTransform: containsURLs
};

/*

<a href=url>
<applet codebase=url>
<area href=url>
<base href=url>
<blockquote cite=url>
<body background=url>
<del cite=url>
<form action=url>
<frame longdesc=url> and <frame src=url>
<head profile=url>
<iframe longdesc=url> and <iframe src=url>
<img longdesc=url> and <img src=url> and <img usemap=url>
<input src=url> and <input usemap=url>
<ins cite=url>
<link href=url>
<object classid=url> and <object codebase=url> and <object data=url> and <object usemap=url>
<q cite=url>
<script src=url>
HTML 5 adds a few (and HTML5 seems to not use some of the ones above as well):

<audio src=url>
<button formaction=url>
<command icon=url>
<embed src=url>
<html manifest=url>
<input formaction=url>
<source src=url>
<video poster=url> and <video src=url>
*/