var gulp = require('gulp');
var replace = require('gulp-ex-replace');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var glob = require('glob');
var path = require('path');
var linkPath = 'https://www.apheo.ca/upload/editor/pdf-ci-pages/';
var today = new Date();
var dateOptions = { month: 'long', year: 'numeric', day: 'numeric'};

// Get the names of each file to process
var filenames = glob.sync('./*.html').map(function(fileDir){
  return path.basename(fileDir, '.html');
});
// Concat new history table to each file and add a link to legacy pdf
filenames.forEach(function(name){
  gulp.task(name+'-append', function(){
    return gulp.src(['./fixed/'+name+'-clean.html', './UpdateHistoryRow.txt'])
               .pipe(concat(name+'-fixed.html'))
			   .pipe(replace(/href='pdf-target'/g,'href="'+linkPath+name+'.pdf"'))
			   .pipe(replace(/name='pdf-target'/g,'name=''+name+'''))
			   .pipe(replace(/{{\sdate\s}}/g,today.toLocaleDateString('en-us', dateOptions)))
               .pipe(gulp.dest('./fixed'));
  });
  gulp.task(name+'-build', gulp.series( [name+'-append'] ));
});

gulp.task('build', gulp.series( filenames.map(function(name){ return name+'-build'; }) ));

gulp.task('cleanUp', function(){
  return gulp.src('./*.html')
             //Add 'Core Indicator' to the indicator title
             .pipe(replace(/<h1>(.+)<\/h1>/g,'<h1>$1 Core Indicator</h1>'))
             //Remove the 'Description' sub-heading
             .pipe(replace(/<h2>Description<\/h2>(\r\n)?/g,''))
			 //Remove 'Print' and 'Download' buttons
			 .pipe(replace(/<a href='javascript: window.print();' class='print_btn'>Print<\/a><a href='#' class='download_btn'>Download<\/a>/,''))
             //Remove second column in method of calculation table
             .pipe(replace(/<td>\r\n\t*<p class='data_summary'>.+\r\n\t*<\/p><\/td>\r\n/g,''))
             //Change Basic Categories to 'Recommended Subset Analysis Categories'
             .pipe(replace(/<h2>Basic Categories<\/h2>/g,'<h2>Recommended Subset Analysis Categories</h2>'))
             //Change Checklist to 'General Checklist'
             .pipe(replace(/(<h6 .+>)Checklist<\/h6>/g,'$1General Checklist</h6>'))
             //Change Comments to 'General Comments'
             .pipe(replace(/(<h6 .+>)Comments<\/h6>/g,'$1General Comments</h6>'))
             //Change Other References to 'General References'
             .pipe(replace(/(<h6 .+>)Other References<\/h6>/g,'$1General References</h6>'))
			 //Remove the table so we can append the better one
             .pipe(replace(/^\s*<div>\r\n\s*<div class='revision_history ci_box'>[\s\S]+$/gm,''))
             //Append file name with '-clean'
             .pipe(rename(function(path){ path.basename += '-clean'; }))
             .pipe(gulp.dest('./fixed'));
});
gulp.task('default', gulp.series( ['cleanUp', 'build'] ));