var gulp = require('gulp');
var replace = require('gulp-ex-replace');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var glob = require('glob');
var path = require('path');
var gulpif = require('gulp-if');
var updateHistory = require('./update-history');
var linkPath = 'https://www.apheo.ca/upload/editor/pdf-ci-pages/';
var today = new Date();
var dateOptions = { month: 'long', year: 'numeric', day: 'numeric'};
// Check whether the Revision history table exists
var hasTable = function(file){
  const regex = new RegExp('<table class="revision_history_tbl">', 'g');
  const contents = file.contents.toString();
  return regex.test(contents);
};

// Get the names of all the flies
var filenames = glob.sync('./*.html').map(function(fileDir){
  return path.basename(fileDir, '.html');
});

filenames.forEach(function(name){
  gulp.task(name+'-append', function(){
    // Concat new history table to each file and add a link to legacy pdf
    return gulp.src(['./clean/'+name+'-no-tbl.html', 'UpdateHistoryRow.txt'], {allowEmpty: true})
               .pipe(concat(name + '-clean.html'))
			         .pipe(replace(/href="pdf-target"/g,'href="'+linkPath+name+'.pdf"'))
			         .pipe(replace(/name="pdf-target"/g,'name="'+name+'"'))
			         .pipe(replace(/{{\sdate\s}}/g,today.toLocaleDateString('en-us', dateOptions)))
               .pipe(gulp.dest('./fixed'));
  });
  gulp.task(name+'-has-table', function(){
    return gulp.src('./clean/'+name+'-clean.html', {allowEmpty: true})
			         .pipe(replace(/href="pdf-target"/g,'href="'+linkPath+name+'.pdf"'))
			         .pipe(replace(/name="pdf-target"/g,'name="'+name+'"'))
               .pipe(replace(/{{\sdate\s}}/g,today.toLocaleDateString('en-us', dateOptions)))
               .pipe(gulp.dest('./fixed'));
  });
  gulp.task(name+'-build', gulp.series( [name+'-append', name+'-has-table'] ));
});
gulp.task('build', gulp.series( filenames.map(function(name){ return name+'-build'; }) ));

gulp.task('cleanUp', function(){
  // Check for the Revision History table
  return gulp.src('./*.html')
             //Add 'Core Indicator' to the indicator title
             .pipe(replace(/<h1>(.+)<\/h1>/g,'<h1>$1 Core Indicator</h1>'))
             //Remove the 'Description' sub-heading
             .pipe(replace(/<h2>Description<\/h2>(\r\n)?/g,''))
			       //Remove 'Print' and 'Download' buttons
			       .pipe(replace(/<a href="javascript: window\.print\(\);" class="print_btn">Print<\/a><a href="#" class="download_btn">Download<\/a>/g,''))
             //Remove second column in method of calculation table
             .pipe(replace(/<td>\r\n\t*<p class="data_summary">.+\r\n\t*<\/p><\/td>\r\n/g,''))
             //Change Basic Categories to 'Recommended Subset Analysis Categories'
             .pipe(replace(/<h2>Basic Categories<\/h2>/g,'<h2>Recommended Subset Analysis Categories</h2>'))
             //Change Checklist to 'General Checklist'
             .pipe(replace(/(<h6 .+>)Checklist<\/h6>/g,'$1General Checklist</h6>'))
             //Change Comments to 'General Comments'
             .pipe(replace(/(<h6 .+>)Comments<\/h6>/g,'$1General Comments</h6>'))
             //Change Other References to 'General References'
             .pipe(replace(/(<h6 .+>)Other References<\/h6>/g,'$1General References</h6>'))
			       //Remove the table so we can append the better one
             .pipe(replace(/^(\s*<div>\r\n\s*<div class="revision_history ci_box">[\s\S]+<\/tr>)$/gm,'$1' + updateHistory.insert))
             //Append file name with '-clean' if a history table exists
             .pipe(gulpif(hasTable,
                          rename(function(path){ path.basename += '-clean'; }),
                          rename(function(path){ path.basename += '-no-tbl';})))
             .pipe(gulp.dest('./clean'));
});
gulp.task('default', gulp.series( ['cleanUp', 'build'] ));