var chromedriver = require('chromedriver'),
	child_process = require('child_process'),
	exec = child_process.exec,
	_ = require('underscore');

function startChrome(options) {
	options = _.extend({
		port: 9222,
		appName: 'Chromium',
		url: ''
	}, options);

	return new Promise(function(resolve, reject) {
		exec('open -a "' + options.appName + '" --args ' + options.url + ' --remote-debugging-port=' + options.port, function(err, stout, stderr) {
			if(err) {
				reject(err);
			} else {
				resolve(options.port);
			}
		});
	});
}
/*

startChrome({
	url: 'umich.edu'
}).then(function() {
	var x = chromedriver.start();
	console.log(x);
	chromedriver.stop();
}).catch(function(err) {
	console.error(err);
});
*/
var webdriverio = require('webdriverio');
var options = {
		desiredCapabilities: {
			browserName: 'chrome'
		},
		host: "localhost",
		port: 9515
	};
var client = webdriverio.remote(options);

client
    .init()
    .url('https://duckduckgo.com/')
    .setValue('#search_form_input_homepage', 'WebdriverIO')
    .click('#search_button_homepage')
    .getTitle().then(function(title) {
        console.log('Title is: ' + title);
        // outputs: "Title is: WebdriverIO (Software) at DuckDuckGo"
    })
	.catch(function(err) {
		console.log(err);
	})
    .end();