var packager = require('electron-packager')
packager({
    dir: '.',
    platform: 'darwin',
    arch: 'x64'
}, function (err, appPaths) {
    console.error(err);
    console.log(appPaths)
})