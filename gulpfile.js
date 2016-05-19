// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var cleancss = require('gulp-clean-css');
var tsc = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var inject = require('gulp-inject');
var wiredep = require('wiredep').stream;
var bower = require('gulp-bower');


var serverConfig = {
	livereload: true,
	port: 9000,
	open: true
};

var source_scss = "src/scss";
var source_ts = "src/ts";

var dest_css = "public/stylesheets";
var dest_js = "public/javascripts";

var public = "public";


// Compile Sass
gulp.task('sass', function(){
	return gulp.src(source_scss+'/*.scss')
	.pipe(sass())
	.pipe(cleancss())
	.pipe(gulp.dest(dest_css));
});

// Concatenate & Minify JS
gulp.task('compileScripts', function(){
	return gulp.src(source_ts+'/*.ts')
	.pipe(sourcemaps.init())
	.pipe(tsc({
		target: 'ES5',
		out: 'compiled.js'
	}))	
	.pipe(uglify())
	.pipe(sourcemaps.write('/'))
	.pipe(gulp.dest(dest_js));
});

// Inject CSS and JS
gulp.task('inject', ['compileScripts', 'sass'],function(){

	var sourceOptions = {
		read: false, 
		cwd: __dirname + "/" + public
	};

	var injectOptions = {
		addRootSlash: false
	};

	var target = gulp.src('./views/*.html');
	var sources = gulp.src(['stylesheets/*.css', 'javascripts/*.js'], sourceOptions);
	return target.pipe(inject(sources, injectOptions))
	.pipe(gulp.dest('./views'));
});


// Watch
gulp.task('watch', function(){
	// Compile SCSS & Typescript
	gulp.watch(source_ts+'/*.ts', ['compileScripts', 'inject']);
	gulp.watch(source_scss+'/*.scss', ['sass', 'inject']);
});


// Wire Bower dependencies to HTML
gulp.task('wiredep', function () {
	
	gulp.src('views/index.html')
	.pipe(wiredep({ignorePath: '../public/'}))
	.pipe(gulp.dest('views')); 
});

gulp.task('default', ['sass', 'compileScripts', 'inject', 'watch']);
