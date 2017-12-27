var _ = require('underscore'), urlTransform = require('../../server/url_transform').urlTransform, processCSS = require('../../server/css_parser').parseCSS, processCSSURLs = require('../../server/css_parser').processCSSURLs, fs = require('fs');
fs.readFile('main.css', 'utf-8', (err, data) => {
    if (err)
        throw err;
    var newCSS = processCSS(data, 'https://www.osu.edu/assets/site/css/main.css');
    //console.log(newCSS);
});
