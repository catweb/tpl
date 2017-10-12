var gulp = require('gulp'),
    postcss = require('gulp-postcss'),
    less = require('gulp-less'),
    newer = require('gulp-newer'),
    cached = require('gulp-cached'),
    remember = require('gulp-remember'),
    watch = require('gulp-watch'),
    gulpif = require('gulp-if'),
    concat = require('gulp-concat'),
    debug = require('gulp-debug'),
    imagemin = require('gulp-image'),
    babel = require('gulp-babel'),
    spritesmith = require('gulp.spritesmith'),
    path = require('path'),
    cleanCSS = require('gulp-clean-css'),
    minify = require('gulp-minify'),
    sourcemaps = require('gulp-sourcemaps'),
    urlAdjuster = require('gulp-css-url-adjuster'),
    pug = require('gulp-pug'),
    pugData = require('./_src/pug/data.json'),
    stream = require('merge-stream'),
    del = require('del'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    autoprefixer = require('autoprefixer');


// environments
var environments = {
  dev: false,
  prod: false,
  serv: false
};
gulp.task('devEnv', function() {
  environments.dev = true;
});
gulp.task('prodEnv', function() {
  environments.prod = true;
});
gulp.task('serverEnv', function() {
  environments.serv = true;
  environments.dev = true;
});

// paths
var src = {
        less: ['_src/css/common.less','_src/css/less/**/*.less'],
        img: '_src/img/**/*.{png,jpeg,jpg,gif,svg}',
        sprites: '_src/sprites/**/*',
        jsLib: '_src/js/libraries/**/*.js',
        jsMod: '_src/js/modules/**/*.js',
        pugPages: '_src/pug/pages/*.pug',
        pugBlocks: '_src/pug/blocks/*.pug'
    },
    build = {
        css: 'build/css/',
        img: 'build/img/',
        sprites: 'build/img/sprites/',
        jsLib: 'build/js/vendor/',
        jsMod: 'build/js/',
        pugPages: 'build/tpl',
        pugBlocks: 'build/tpl/blocks'
    };

// tasks
gulp.task('server', function() {
  browserSync.init({
    server: {
      baseDir: 'build',
      directory: true
    },
    ui: {
      port: 8080
    },
    ghostMode: false,
    port: 7777,
    logPrefix: 'SERVER',
    logConnections: true,
    notify: true,
    reloadOnRestart: true
  })
});
gulp.task('css', function(){
    var processors = [
        autoprefixer({
          browsers: ['last 5 versions', 'IE 9'],
          cascade: false
        })
    ];
    return gulp.src(src.less)
        .pipe(gulpif(environments.dev, cached('styles')))
        .pipe(less())
        .pipe(gulpif(environments.prod, postcss(processors)))
        .pipe(gulpif(environments.dev, remember('styles')))
        .pipe(concat('style.css'))
        .pipe(gulpif(environments.prod, urlAdjuster({
            replace:  ['/img/','../img/']
            // append: '?version=1',
            // prepend: '../path'
        })))
        .pipe(gulpif(environments.prod, cleanCSS()))
        .pipe(gulp.dest(build.css))
        .pipe(gulpif(environments.serv, reload({ stream: true })));
});

gulp.task('imgMin', function(){
    return gulp.src(src.img)
        .pipe(newer(build.img))
        .pipe(gulpif(environments.prod, imagemin({
            pngquant: false,
            optipng: false,
            zopflipng: true,
            jpegRecompress: false,
            jpegoptim: true,
            mozjpeg: true,
            gifsicle: true,
            svgo: true,
            concurrent: 10
        })))
        .pipe(gulp.dest(build.img))
        .pipe(gulpif(environments.serv, reload({ stream: true })));
});

gulp.task('sprite', function () {
    var spriteData = gulp.src(src.sprites)
        .pipe(spritesmith({
            imgName: 'sprite.png',
            cssName: 'sprites.less',
            cssFormat: 'less',
            cssTemplate: 'sprite.handlebars',
            imgPath: '/img/sprites/sprite.png',
            padding: 5,
            algorithm: 'binary-tree'
        }));

    spriteData.img.pipe(gulp.dest(build.sprites));
    spriteData.css.pipe(gulp.dest('_src/css/'));

    return spriteData;
});

gulp.task('js', function(){
    var lib = gulp.src(src.jsLib)
        .pipe(gulpif(environments.dev, cached('jsLib')))
        .pipe(gulpif(environments.dev, remember('jsLib')))
        .pipe(concat('libraries.js'))
        .pipe(gulp.dest(build.jsLib))
        .pipe(gulpif(environments.serv, reload({ stream: true })));

    var mod = gulp.src(src.jsMod)
        .pipe(gulpif(environments.dev, sourcemaps.init()))
        .pipe(gulpif(environments.dev, cached('jsMod')))
        .pipe(gulpif(environments.dev, remember('jsMod')))
        .pipe(concat('main.js'))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulpif(environments.prod, minify({
            ext:{
                min:'.min.js'
            }
        })))
        .pipe(gulpif(environments.dev, sourcemaps.write()))
        .pipe(gulp.dest(build.jsMod))
        .pipe(gulpif(environments.serv, reload({ stream: true })));

    return stream(lib, mod);
});

gulp.task('pug', function() {
    var pages = gulp.src(src.pugPages)
        .pipe(gulpif(environments.dev, cached('pugPages')))
        .pipe(gulpif(environments.dev, remember('pugPages')))
        .pipe(pug({
            locals: pugData,
            pretty: '\t'
        }))
        .pipe(gulp.dest(build.pugPages))
        .pipe(gulpif(environments.serv, reload({ stream: true })));

    var blocks = gulp.src(src.pugBlocks)
        .pipe(gulpif(environments.dev, cached('pugBlocks')))
        .pipe(gulpif(environments.dev, remember('pugBlocks')))
        .pipe(pug({
            locals: pugData,
            pretty: '\t'
        }))
        .pipe(gulp.dest(build.pugBlocks))
        .pipe(gulpif(environments.serv, reload({ stream: true })));

    return stream(pages, blocks);
});

gulp.task('watch', function(){
    gulp.watch(src.less, ['css']).on('unlink', function(filepath){
        remember.forget('styles', path.resolve(filepath));
        delete cached.caches.styles[path.resolve(filepath)];
    });
    gulp.watch(src.img, ['imgMin']);
    gulp.watch(src.sprites, ['sprite']);
    gulp.watch(src.jsMod, ['js']).on('unlink', function(filepath){
        remember.forget('jsMod', path.resolve(filepath));
        delete cached.caches.jsMod[path.resolve(filepath)];
    });
    gulp.watch(src.jsLib, ['js']).on('unlink', function(filepath){
        remember.forget('jsLib', path.resolve(filepath));
        delete cached.caches.jsLib[path.resolve(filepath)];
    });
    gulp.watch(src.pugPages, ['pug']).on('unlink', function(filepath){
        remember.forget('pugPages', path.resolve(filepath));
        delete cached.caches.pugPages[path.resolve(filepath)];
    });
    gulp.watch(src.pugBlocks, ['pug']).on('unlink', function(filepath){
        remember.forget('pugBlocks', path.resolve(filepath));
        delete cached.caches.pugBlocks[path.resolve(filepath)];
    });
});

gulp.task('clean', function() {
    return del.sync([build.css, build.img]);
});

gulp.task('dev', [
    'devEnv',
    'sprite',
    'css',
    'js',
    'imgMin',
    'pug',
    'watch'
]);

gulp.task('devServ', [
  'serverEnv',
  'server',
  'sprite',
  'css',
  'js',
  'imgMin',
  'pug',
  'watch'
]);

gulp.task('production', [
    'prodEnv',
    'clean',
    'imgMin',
    'sprite',
    'css',
    'js',
    'pug'
]);
