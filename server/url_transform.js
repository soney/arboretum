//http://stackoverflow.com/questions/2725156/complete-list-of-html-tag-attributes-which-have-a-url-value
var URL = require('url');
var TRANSFORM = 'transform',
	REFORMAT = 'reformat';

var containsURLs = {
	'a': {
		'href': {
			strategy: REFORMAT,
			transform: function(url, baseURL) {
				return 'javascript:void(0);';
			}
		}
	},

	'body': {
		'background': {
			strategy: TRANSFORM,
			transform: function(url, baseURL) {
				return transformURL(url, baseURL);
			}
		}
	},

	'img': {
		'src': {
			strategy: TRANSFORM,
			transform: function(url, baseURL) {
				return transformURL(url, baseURL);
			}
		}
	},

	'link': {
		'href': {
			strategy: TRANSFORM,
			transform: function(url, baseURL) {
				return transformURL(url, baseURL);
			}
		}
	},

	'form': {
		'action': {
			strategy: REFORMAT,
			transform: function(url, baseURL) {
				return '';
			}
		}
	}
};

function transformURL(url, baseURL) {
	var absoluteURL = URL.resolve(baseURL, url),
		relativeURL = URL.format({
			pathname: 'r',
			query: {
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