var fs = require('fs');
var UglifyJS = require('uglify-js');
var uglifycss = require('uglifycss');

var files = [
    'src/scripts/ERNO.js',
    'src/scripts/utils/utils.js',
    'src/scripts/utils/Number.js',
    'src/scripts/utils/String.js',
    'src/scripts/utils/Array.js',
    'src/scripts/colors.js',
    'src/scripts/directions.js',
    'src/scripts/queues.js',
    'src/scripts/twists.js',
    'src/scripts/cubelets.js',
    'src/scripts/groups.js',
    'src/scripts/slices.js',
    'src/scripts/folds.js',
    'src/scripts/projector.js',
    'src/scripts/interaction.js',
    'src/scripts/controls.js',
    'src/scripts/cubes.js',
    'src/scripts/solvers.js',
    'src/scripts/renderer.js'];

if (fs.existsSync('build')) {
    fs.renameSync('build', 'build' + new Date().toISOString().replace(/[-:T]/g, '').replace(/^(\d{8})(\d{6}).+$/, '$1_$2'))
}
fs.mkdirSync('build');
fs.mkdirSync('build/styles');
fs.mkdirSync('build/media');

files.forEach(function (file, i) {
    if (i) fs.appendFileSync('build/cuber.js', "\n\n");
    fs.appendFileSync('build/cuber.js', fs.readFileSync(file));
});

fs.writeFileSync('build/cuber.min.js', "/**\n" + ("@preserve\n@license\n" + fs.readFileSync('LICENSE')).replace(/^/gm, ' * ') + "\n*/\n\n" + UglifyJS.minify(files).code);

fs.writeFileSync('build/styles/cube.css', fs.readFileSync('src/styles/cube.css'));

fs.writeFileSync('build/styles/cube.min.css', uglifycss.processFiles(['src/styles/cube.css']));

fs.readdirSync('src/media').forEach(function (file) {
    fs.writeFileSync('build/media/' + file, fs.readFileSync('src/media/' + file));
});

console.log('Done.');
