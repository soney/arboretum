const PythonShell = require('python-shell');
var pythonShellOptions = {
    pythonPath: 'bin/python3.6',
    scriptPath: 'scripts/'
};
function runScript(scriptName, options = {}) {
    return new Promise(function (resolve, reject) {
        PythonShell.run(scriptName, _.extend({}, pythonShellOptions, options), function (err, results) {
            if (err) {
                reject(err);
            }
            else {
                resolve(results);
            }
        });
    });
}
module.exports = {
    recordPage: function (serializedPage) {
        return runScript('record_page.py', {});
    }
};
