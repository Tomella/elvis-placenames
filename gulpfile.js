// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var fs            = require('fs');
var header        = require('gulp-header');
var jshint        = require('gulp-jshint');
var babel         = require('gulp-babel');
var concat        = require('gulp-concat');
var concatCss     = require('gulp-concat-css');
var uglify        = require('gulp-uglify');
var templateCache = require('gulp-angular-templatecache');
var addStream     = require('add-stream');

var directories = {
	assets:      'dist/placenames/assets',
	source:      'source',
	resources:  'resources',
	outresources:'dist/placenames/resources',
   views:      'views',
   outbower:   'dist/placenames/bower_components'
};

// Lint Task
gulp.task('lint', function() {
    return gulp.src(directories.source + '/**/*.js')
        .pipe(jshint({esversion: 6}))
        .pipe(jshint.reporter('default'));
});

gulp.task('resources', function () {
    return gulp.src(directories.resources + '/**/*')
        .pipe(gulp.dest(directories.outresources));
});

gulp.task('views', function () {
    return gulp.src(directories.views + '/**/*')
        .pipe(gulp.dest('dist'));
});

//Concatenate & Minify JS
gulp.task('placenamesScripts', function() {
   return preparePlacenamesScripts();
});

gulp.task('antarcticScripts', function() {
   return prepareAntarcticScripts();
});

gulp.task('antarcticViewerScripts', function() {
   return prepareAntarcticViewerScripts();
});

function prepareAntarcticScripts() {
   return gulp.src([directories.source + '/common/**/*.js', directories.source + '/antarctic/**/*.js'])
      .pipe(babel({
            compact: false,
            comments: true,
            presets: ['es2015', 'es2016', 'es2017']
      }))
	   .pipe(addStream.obj(prepareNamedTemplates("antarctic")))
      .pipe(concat('antarctic.js'))
      .pipe(header(fs.readFileSync(directories.source + '/licence.txt', 'utf8')))
      .pipe(gulp.dest(directories.assets));
}


function prepareAntarcticViewerScripts() {
   return gulp.src([directories.source + '/common/**/*.js', directories.source + '/antarcticviewer/**/*.js'])
      .pipe(babel({
            compact: false,
            comments: true,
            presets: ['es2015', 'es2016', 'es2017']
      }))
	   .pipe(addStream.obj(prepareNamedTemplates("antarcticviewer")))
      .pipe(concat('antarcticviewer.js'))
      .pipe(header(fs.readFileSync(directories.source + '/licence.txt', 'utf8')))
      .pipe(gulp.dest(directories.assets));
}

function preparePlacenamesScripts() {
   return gulp.src([directories.source + '/common/**/*.js', directories.source + '/placenames/**/*.js'])
      .pipe(babel({
            compact: false,
            comments: true,
            presets: ['es2015', 'es2016', 'es2017']
      }))
	   .pipe(addStream.obj(prepareNamedTemplates("placenames")))
      .pipe(concat('placenames.js'))
      .pipe(header(fs.readFileSync(directories.source + '/licence.txt', 'utf8')))
      .pipe(gulp.dest(directories.assets));
}


//Concatenate & Minify JS
gulp.task('squashPlacenames', function() {
	return squashJs('placenames');
});

gulp.task('squashAntarctic', function() {
	return squashJs('antarctic');
});

gulp.task('squashAntarcticViewer', function() {
	return squashJs('antarcticviewer');
});

function squashJs(name) {
	return gulp.src(directories.assets + '/' + name + '.js')
		.pipe(uglify())
		.pipe(gulp.dest(directories.assets + "/min"));
}

// Watch Files For Changes
gulp.task('watch', function() {
	// We watch both JS and HTML files.
    gulp.watch(directories.source + '/**/*(*.js|*.html)', ['lint']);
    gulp.watch(directories.source + '/placenames/**/*(*.js|*.html)', ['placenamesScripts']);
    gulp.watch(directories.source + '/antarctic/**/*(*.js|*.html)', ['antarcticScripts']);
    gulp.watch(directories.source + '/antarctic/**/*(*.js|*.html)', ['antarcticViewerScripts']);
    gulp.watch(directories.source + '/common/**/*(*.js|*.html)', ['antarcticScripts', 'placenamesScripts']);
    gulp.watch(directories.source + '/**/*.css', ['concatCss']);
    gulp.watch(directories.assets + '/antarctic.js', ['squashAntarctic']);
    gulp.watch(directories.assets + '/antarcticviewer.js', ['squashAntarcticViewer']);
    gulp.watch(directories.assets + '/placenames.js', ['squashPlacenames']);
    gulp.watch(directories.views +  '/*', ['views']);
    gulp.watch(directories.resources + '/**/*', ['resources']);
    //gulp.watch('scss/*.scss', ['sass']);
});

gulp.task('concatCss', function () {
  return gulp.src(directories.source + '/**/*.css')
    .pipe(concatCss("placenames.css"))
    .pipe(gulp.dest(directories.assets));
});

gulp.task('package', function() {
   return gulp.src('package.json')
      .pipe(gulp.dest(directories.assets));
});

gulp.task('build', ['views', 'package', 'placenamesScripts', 'antarcticScripts', 'concatCss', 'resources'])

// Default Task
gulp.task('default', ['lint', 'placenamesScripts', 'antarcticScripts', 'concatCss', 'watch', 'package', 'resources', 'views']);


function prepareNamedTemplates(name) {
   return gulp.src([directories.source + '/' + name + '/**/*.html', directories.source + '/common/**/*.html'])
      .pipe(templateCache({module: name + ".templates", standalone : true}));
}