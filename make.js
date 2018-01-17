var packager = require('electron-packager')
packager({
    dir: '.',
    platform: 'darwin',
    arch: 'x64',
    overwrite: true,
    icon: 'resources/logo/icon.icns'
}, function (err, appPaths) {
    if(err) {
        console.error(err);
    } else {
        var path = appPaths[0];
        console.log('Built at ' + path);
    }
})
