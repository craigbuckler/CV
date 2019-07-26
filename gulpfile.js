// Gulp.js configuration

(() => {

  'use strict';

  const

    // development or production
    devBuild = ((process.env.NODE_ENV || 'development').trim().toLowerCase() === 'development'),

    // package
    pkg = require('./package.json'),

    // folders
    dir = {
      base: __dirname + '/',
      src: 'src/',
      dest: 'dest/',
      build: 'dest/build/'
    },

    // Gulp and plugins
    gulp        = require('gulp'),
    noop        = require('gulp-noop'),
    newer       = require('gulp-newer'),
    imagemin    = require('gulp-imagemin'),
    preprocess  = require('gulp-preprocess'),
    htmlclean   = devBuild ? null : require('gulp-htmlclean'),
    htmllint    = require('gulp-htmllint'),
    sass        = require('gulp-sass'),
    postcss     = require('gulp-postcss'),

    // other modules
    del         = require('del');


  // browser-sync
  let browsersync = false;


  // show build type
  console.log(pkg.name + ' ' + pkg.version + ', ' + (devBuild ? 'development' : 'production') + ' build');

  // ______________________________________________________
  // clean dest folder
  function clean() {

    return del(
      [ dir.dest ],
      { force: true }
    );

  }
  exports.clean = clean;


  // clean build files
  function cleanBuild() {

    return del(
      [ dir.build ],
      { force: true }
    );

  }


  // ______________________________________________________
  // image processing
  const imagesCfg = {
    src: dir.src + 'images/**/*',
    build: dir.build + 'images/',
    minOpts: {
      optimizationLevel: 5
    }
  };

  function images() {

    return gulp.src(imagesCfg.src)
      .pipe(newer(imagesCfg.build))
      .pipe(imagemin(imagesCfg.minOpts))
      .pipe(gulp.dest(imagesCfg.build));

  }
  exports.images = images;


  // ______________________________________________________
  // CSS processing
  const cssCfg = {
    src: dir.src + 'scss/main.scss',
    watch: dir.src + 'scss/**/*',
    build: dir.build + 'css/',
    sassOpts: {
      outputStyle: 'nested',
      imagePath: '/images/',
      precision: 3,
      errLogToConsole: true
    },
    processors: [
      require('postcss-assets')({
        loadPaths: ['images/'],
        basePath: dir.build
      }),
      require('autoprefixer'),
      require('css-mqpacker'),
      require('cssnano')
    ]
  };

  function css() {

    return gulp.src(cssCfg.src)
      .pipe(sass(cssCfg.sassOpts).on('error', sass.logError))
      .pipe(postcss(cssCfg.processors))
      .pipe(gulp.dest(cssCfg.build));

  }
  exports.css = gulp.series(images, css);


  // ______________________________________________________
  // HTML processing
  const
    final = 'craig-buckler.html',
    htmlCfg = {
      in: dir.src + 'html/' + final,
      watch: dir.src + 'html/**/*',
      out: dir.dest,
      context: {
        devBuild: devBuild,
        author: pkg.author,
        title: pkg.description,
        version: pkg.version,
        cv: pkg.cv
      },
      htmllint: {
        'failOnError': false,
        'rules': {
          'attr-bans': [],
          'attr-name-ignore-regex': '[viewBox|xlink:href]',
          'indent-width': false,
          'tag-bans': false,
          'line-end-style': false
        }
      },
      htmlclean: {
        protect: [
          /\sd=".*?"/g // prevent zero removal in SVG path
        ]
      }
    };

  function html() {

    return gulp.src(htmlCfg.in)
      .pipe(preprocess({ context: htmlCfg.context }))
      .pipe(htmlclean ? htmlclean(htmlCfg.htmlclean) : noop())
      .pipe(htmllint(htmlCfg.htmllint))
      .pipe(gulp.dest(htmlCfg.out));

  }
  exports.html = gulp.series(exports.css, html);


  // ______________________________________________________
  // browser-sync
  const syncOpts = {
    server: {
      baseDir: dir.dest,
      index: final
    },
    port: 8000,
    files: dir.dest + final,
    open: false,
    notify: false,
    ghostMode: false,
    ui: {
      port: 8001
    }
  };


  // run server
  function server(done) {

    if (browsersync === false) {
      browsersync = devBuild ? require('browser-sync').create() : null;
    }
    if (browsersync) browsersync.init(syncOpts);

    done();

  }


  // watch
  function watch(done) {

    gulp.watch([ imagesCfg.src, cssCfg.watch, htmlCfg.watch ], exports.html);
    done();

  }


  // ______________________________________________________
  // build
  exports.build = gulp.series(exports.html, cleanBuild);

  exports.default = gulp.series(exports.html, watch, server);

})();
