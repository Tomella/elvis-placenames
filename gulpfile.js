// Include gulp
let { src, dest, watch, series } = require('gulp');

// Include Our Plugins
let fs = require('fs');
let header = require('gulp-header');
let eslint = require('gulp-eslint');
let babel = require('gulp-babel');
let concat = require('gulp-concat');
let concatCss = require('gulp-concat-css');
let uglify = require('gulp-uglify');
let templateCache = require('gulp-angular-templatecache');
let addStream = require('add-stream');

let directories = {
   assets: 'dist/placenames/assets',
   source: 'source',
   resources: 'resources',
   outresources: 'dist/placenames/resources',
   views: 'views',
   outbower: 'dist/placenames/bower_components'
};

const babelConfig = {
   compact: false,
   comments: true,
   presets: ['@babel/preset-env']
}

// Lint Task
function lint() {
   return src(directories.source + '/**/*.js')
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
}
exports.lint = lint;

function resources() {
   return src(directories.resources + '/**/*')
      .pipe(dest(directories.outresources));
}
exports.resources = resources;

function views() {
   return src(directories.views + '/**/*')
      .pipe(dest('dist'));
}
exports.views = views;

//Concatenate & Minify JS
function placenamesScripts() {
   return src([directories.source + '/common/**/*.js', directories.source + '/placenames/**/*.js'])
      .pipe(babel(babelConfig))
      .pipe(addStream.obj(prepareNamedTemplates("placenames")))
      .pipe(concat('placenames.js'))
      .pipe(header(fs.readFileSync(directories.source + '/licence.txt', 'utf8')))
      .pipe(dest(directories.assets));
}
exports.placenamesScripts = placenamesScripts;

function antarcticScripts() {
   return src([directories.source + '/common/**/*.js', directories.source + '/antarctic/**/*.js'])
      .pipe(babel(babelConfig))
      .pipe(addStream.obj(prepareNamedTemplates("antarctic")))
      .pipe(concat('antarctic.js'))
      .pipe(header(fs.readFileSync(directories.source + '/licence.txt', 'utf8')))
      .pipe(dest(directories.assets));
}
exports.antarcticScripts = antarcticScripts;

function antarcticViewerScripts() {
   return src([directories.source + '/common/**/*.js', directories.source + '/antarcticviewer/**/*.js'])
      .pipe(babel(babelConfig))
      .pipe(addStream.obj(prepareNamedTemplates("antarcticviewer")))
      .pipe(concat('antarcticviewer.js'))
      .pipe(header(fs.readFileSync(directories.source + '/licence.txt', 'utf8')))
      .pipe(dest(directories.assets));
}
exports.antarcticViewerScripts = antarcticViewerScripts;

//Concatenate & Minify JS
function squashPlacenames() {
   return squashJs('placenames');
}
exports.squashPlacenames = squashPlacenames;

function squashAntarctic() {
   return squashJs('antarctic');
}
exports.squashAntarctic = squashAntarctic;

function squashAntarcticViewer() {
   return squashJs('antarcticviewer');
}
exports.squashAntarcticViewer = squashAntarcticViewer;

function squashJs(name) {
   return src(directories.assets + '/' + name + '.js')
      .pipe(uglify())
      .pipe(dest(directories.assets + "/min"));
}

// Watch Files For Changes
function watchFiles() {
   let ignore = { ignoreInitial: false };
   // We watch both JS and HTML files.
   watch(directories.source + '/**/*(*.js|*.html)', lint);
   watch(directories.source + '/placenames/**/*(*.js|*.html)', ignore, placenamesScripts);
   watch(directories.source + '/antarctic/**/*(*.js|*.html)', ignore, antarcticScripts);
   watch(directories.source + '/antarctic/**/*(*.js|*.html)', ignore, antarcticViewerScripts);
   watch(directories.source + '/common/**/*(*.js|*.html)', ignore, series(antarcticScripts, placenamesScripts));
   watch(directories.source + '/**/*.css', ignore, catCss);
   watch(directories.assets + '/antarctic.js', squashAntarctic);
   watch(directories.assets + '/antarcticviewer.js', squashAntarcticViewer);
   watch(directories.assets + '/placenames.js', squashPlacenames);
   watch(directories.views + '/*', ignore, views);
   watch(directories.resources + '/**/*', ignore, resources);
   watch('package.json', ignore, package);
}
exports.watchFiles = watchFiles;

function catCss() {
   return src(directories.source + '/**/*.css')
      .pipe(concatCss("placenames.css"))
      .pipe(dest(directories.assets));
}
exports.catCss = catCss;

function package() {
   return src('package.json')
      .pipe(dest(directories.assets));
}
exports.package = package;

// Default Task
exports.default = watchFiles;


function prepareNamedTemplates(name) {
   return src([directories.source + '/' + name + '/**/*.html', directories.source + '/common/**/*.html'])
      .pipe(templateCache({ 
         module: name + ".templates", 
         standalone:true
      }));
}