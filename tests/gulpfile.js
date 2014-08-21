var gulp = require('gulp');
var inliner = require('../src/index');

gulp.task('default', function() {
	gulp.src('doc.html', { cwd: 'data/' })
		.pipe(inliner())
		.pipe(gulp.dest('tmp/'));
});