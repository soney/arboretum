//http://stackoverflow.com/questions/2725156/complete-list-of-html-tag-attributes-which-have-a-url-value
import * as URL from 'url';
import * as srcset from 'srcset';
import * as _ from 'underscore';
import {DOMState} from './state/DOMState';

enum Strategy {
	TRANSFORM,
	REFORMAT
};

export const urlTransform = {
	'a': {
		'href': {
			strategy: Strategy.REFORMAT,
			transform: function(url, baseURL, node) {
				return 'javascript:void(0);';
			}
		}
	},

	'body': {
		'background': {
			strategy: Strategy.TRANSFORM,
			transform: transformURL
		}
	},

	'iframe': {
		'src': {
			strategy: Strategy.TRANSFORM,
			transform: function(url:string, baseURL:string, node:DOMState) {
				var childFrame = node.getChildFrame();
				if(childFrame) {
					return URL.format({
						pathname: 'f',
						query: {
							i: childFrame.getFrameId()
						}
					});
				} else {
					console.error('No child frame');
				}
			}
		},
	},
	'input': {
		'src': {
			strategy: Strategy.TRANSFORM,
			transform: transformURL
		}
	},

	'img': {
		'src': {
			strategy: Strategy.TRANSFORM,
			transform: transformURL
		},
		'srcset': {
			strategy: Strategy.TRANSFORM,
			transform: transformSRCSet
		}
	},

	'source': {
		'src': {
			strategy: Strategy.TRANSFORM,
			transform: transformURL
		},
		'srcset': {
			strategy: Strategy.TRANSFORM,
			transform: transformSRCSet
		},
		'data-srcset': {
			strategy: Strategy.TRANSFORM,
			transform: transformSRCSet
		}
	},

	'link': {
		'href': {
			strategy: Strategy.TRANSFORM,
			transform: transformURL
		}
	},

	'object': {
		'src': {
			strategy: Strategy.TRANSFORM,
			transform: transformURL
		},
		'data': {
			strategy: Strategy.TRANSFORM,
			transform: transformURL
		}
	},

	'form': {
		'action': {
			strategy: Strategy.REFORMAT,
			transform: makeBlank
		},
		'method': {
			strategy: Strategy.REFORMAT,
			transform: makeBlank
		}
	}
};

function makeBlank():string {
	return '';
}

function transformSRCSet(attrVal:string, baseURL:string, node:DOMState, shadow):string {
	const parsed = srcset.parse(attrVal);
	_.each(parsed, function(p:any) {
		p.url = transformURL(p.url, baseURL, node, shadow);
	});
	return srcset.stringify(parsed);
}

function transformURL(url:string, baseURL:string, node:DOMState, shadow):string {
    const absoluteURL:string = URL.resolve(baseURL, url);
    const relativeURL:string = URL.format({
                pathname: 'r',
                query: {
                    // u: shadow.getUserId(),
                    t: node.getTabId(),
                    f: node.getFrameId(),
                    l: absoluteURL
                }
            });

    return relativeURL;
}

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
