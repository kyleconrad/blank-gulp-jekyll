var gulp = require('gulp'),

	// Server plugins
	express = require('express'),
	refresh = require('gulp-livereload'),
	lrserver = require('tiny-lr')(),
	livereload = require('connect-livereload'),

	// Necessary to build Jekyll
	util = require('gulp-util'),
	exec = require('gulp-exec'),

	// Other plugins
	open = require('gulp-open'),
	concat = require('gulp-concat'),
	sass = require('gulp-ruby-sass'),
	rimraf = require('gulp-rimraf'),
	minify = require('gulp-minify-css'),
	htmlbuild = require('gulp-htmlbuild'),
	uglify = require('gulp-uglify'),
	imagemin = require('gulp-imagemin'),

	// Server settings
	lrport = 35729,
	serverport = 5000;


// Server configuration with livereload enabled
var server = express();
server.use(livereload({
	port: lrport
}));
server.use(express.static('./serve'));


// Server initiation and livereload, opens server in browser
gulp.task('serve', function() {
	server.listen(serverport);
	lrserver.listen(lrport);

	gulp.src('./serve/index.html')
	    .pipe(open('', {
	    	url: 'http://localhost:' + serverport
	    }));
});


// Jekyll building
gulp.task('jekyll', function() {
	return gulp.src('')
	           .pipe(exec('jekyll build'))
	           .pipe(refresh(lrserver));
});



// SASS compiling & reloading
gulp.task('sass', function () {
    gulp.src('./prod/_sass/*.scss')
        .pipe(sass({
        	compass: true,
        	noCache: true,
        	quiet: true
        }))
        .pipe(gulp.dest('./serve/css'))
        .pipe(refresh(lrserver));
});

// Clear 'serve' directory prior to running anything to ensure it's clean and no unnecessary files
gulp.task('remove-serve', function() {
	gulp.src('./serve/**/*', { read: false })
		.pipe(rimraf());
});

// Clear 'dist' directory, then minifying, copying, processing, uglifying, etc for build
gulp.task('remove-dist', function() {
	gulp.src('./dist/**/*', { read: false })
		.pipe(rimraf());
});
gulp.task('minify', function() {
	gulp.src('./serve/css/*.css')
		.pipe(minify({
			keepSpecialComments: 0
		}))
		.pipe(gulp.dest('./dist/css'));
});
gulp.task('scripts', function() {
	gulp.src('./serve/js/header/*.js')
		.pipe(concat('header.js'))
		.pipe(gulp.dest('./dist/js'));
});
gulp.task('html', function() {
	gulp.src("./serve/**/*.html")
		.pipe(htmlbuild({
			js: function (files, callback) {
	      		gulp.run('scripts');
	      		callback(null, [ '/js/header.js' ]);
	    	}
	  	}))
	  	.pipe(gulp.dest("./dist"));
});
gulp.task('uglify', function() {
  	gulp.src('./serve/js/*.js')
      	.pipe(uglify())
      	.pipe(gulp.dest('./dist/js'));
});
gulp.task('imagemin', function () {
    gulp.src('./serve/img/**/*')
        .pipe(imagemin({
        	progressive: true
        }))
        .pipe(gulp.dest('./dist/img'));
});



// Watching files for changes before reloading
gulp.task('watch', function() {
	gulp.watch('./prod/_sass/*.scss', function() {
		gulp.run('sass');
	});
	gulp.watch('./prod/img/**/*', function() {
		gulp.run('jekyll');
	});
	gulp.watch('./prod/js/**/*.js', function() {
		gulp.run('jekyll');
	});
	gulp.watch([
			'./prod/**/*.html',
			'./prod/**/*.{markdown,md}'
		], function() {
		gulp.run('jekyll');
	});
	gulp.watch('./serve/**/*.html', function() {
		gulp.src('./serve/**/*.html')
		    .pipe(refresh(lrserver));
	});
});


// Default functionality includes server with livereload and watching
gulp.task('default', [
		'remove-serve',
		'jekyll',
		'sass'
	], function(){
	gulp.run(
		'serve',
		'watch'
	);
});

// Build prep
gulp.task('prep', [
		'remove-serve',
		'jekyll'
	], function(){
	gulp.run(
		'sass'
	);
});

// Build functionality with cleaning, moving, compiling, etc.
gulp.task('build', [
		'remove-dist'
	], function(){
	gulp.run(
		'minify',
		'html',
		'uglify',
		'imagemin'
	);
});