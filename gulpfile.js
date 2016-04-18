// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var cleancss = require('gulp-clean-css');
var tsc = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var inject = require('gulp-inject');
var server = require('gulp-server-livereload');
var wiredep = require('wiredep').stream;
var bower = require('gulp-bower');


var serverConfig = {
	livereload: true,
	port: 9000,
	open: true
};



// Compile Sass
gulp.task('sass', function(){
	return gulp.src('src/scss/*.scss')
	.pipe(sass())
	.pipe(cleancss())
	.pipe(gulp.dest('app/css'));
});

// Concatenate & Minify JS
gulp.task('compileScripts', function(){
	return gulp.src('src/ts/*.ts')
	.pipe(sourcemaps.init())
	.pipe(tsc({
		target: 'ES5',
		out: 'compiled.js'
	}))	
	.pipe(uglify())
	.pipe(sourcemaps.write('/'))
	.pipe(gulp.dest('app/js'));
});

// Inject CSS and JS
gulp.task('inject', ['compileScripts', 'sass'],function(){

	var sourceOptions = {
		read: false, 
		cwd: __dirname + "/app"
	};

	var injectOptions = {
		addRootSlash: false
	};

	var target = gulp.src('./app/*.html');
	var sources = gulp.src(['css/*.css', 'js/*.js'], sourceOptions);
	return target.pipe(inject(sources, injectOptions))
	.pipe(gulp.dest('./app'));
});


// Watch
gulp.task('watch', function(){
	// Compile SCSS & Typescript
	gulp.watch('src/ts/*.ts', ['compileScripts', 'inject']);
	gulp.watch('src/scss/*.scss', ['sass', 'inject']);
});


// Server
gulp.task('server', function(){  
	gulp.src('app')
	.pipe(server(serverConfig));    
});

// Wire Bower dependencies to HTML
gulp.task('wiredep', function () {
	
	gulp.src('app/index.html')
	.pipe(wiredep())
	.pipe(gulp.dest('app')); 
});

gulp.task('bower', function(){
	return bower({
		directory: './app/bower_components'
	});
});

gulp.task('init', ['bower', 'wiredep']);
gulp.task('default', ['sass', 'compileScripts', 'inject', 'watch']);

// Servidor
gulp.task('s', ['server', 'watch']);