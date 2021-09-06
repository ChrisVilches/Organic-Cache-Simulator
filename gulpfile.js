// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var sass = require('gulp-sass')(require('node-sass'));
var uglify = require('gulp-uglify');
var cleancss = require('gulp-clean-css');
var tsc = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');

var sourceScss = "src/scss";
var sourceTs = "src/ts";

var destCss = "public/stylesheets";
var destJs = "public/javascripts";

// TODO: Task file might be incorrect, since some tasks take a lot of time to finish.
//       Upgraded Gulp version and had to revamp everything without reading documentation.

// Compile Sass
gulp.task('sass', async function(){
	return gulp.src(sourceScss+'/*.scss')
						 .pipe(sass())
						 .pipe(cleancss())
						 .pipe(gulp.dest(destCss));
});

// Concatenate & Minify JS
gulp.task('ts', async function(){
	return gulp.src(sourceTs+'/*.ts')
						 .pipe(sourcemaps.init())
						 .pipe(tsc({
						   target: 'ES5',
						   out: 'compiled.js'
						 }))	
						 .pipe(uglify())
						 .pipe(sourcemaps.write('/'))
						 .pipe(gulp.dest(destJs));
});

// Watch
gulp.task('watch', function(){
	// Compile SCSS & Typescript
	gulp.watch(sourceTs+'/*.ts', gulp.series('ts'));
	gulp.watch(sourceScss+'/*.scss', gulp.series('sass'));
});

gulp.task('default', gulp.parallel('sass', 'ts'));
