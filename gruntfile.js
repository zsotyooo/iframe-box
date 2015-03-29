module.exports = function(grunt) {
    var jsFiles = [
        'src/lib/*.js',
        'src/form.js',
        'src/core.js'
    ];

    var jsFilesWithDependencies = Array.prototype.slice.call(jsFiles);
    jsFilesWithDependencies.unshift(
        'node_modules/jquery-simulate-ext/libs/bililiteRange.js',
        'node_modules/jquery-simulate-ext/libs/jquery.simulate.js',
        'node_modules/jquery-simulate-ext/src/jquery.simulate.ext.js',
        'node_modules/jquery-simulate-ext/src/jquery.simulate.key-combo.js',
        'node_modules/jquery-simulate-ext/src/jquery.simulate.key-sequence.js',
        'node_modules/jquery-simulate-ext/src/jquery.simulate.drag-n-drop.js',
        'node_modules/layback.js/layback.js');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            min: {
                options: {
                    compress: true,
                    mangle: false,
                    beautify: false
                },
                files: {
                    'dist/<%= pkg.name %>.<%= pkg.version %>.only.min.js': jsFiles,
                    '<%= pkg.name %>.only.min.js': jsFiles
                }
            },
            dev: {
                options: {
                    compress: false,
                    mangle: false,
                    beautify: true,
                    preserveComments: 'some'
                },
                files: {
                    'dist/<%= pkg.name %>.<%= pkg.version %>.only.js': jsFiles,
                    '<%= pkg.name %>.only.js': jsFiles
                }
            },
            withdeps: {
                options: {
                    compress: true,
                    mangle: false,
                    beautify: false
                },
                files: {
                    'dist/<%= pkg.name %>.<%= pkg.version %>.min.js': jsFilesWithDependencies,
                    '<%= pkg.name %>.min.js': jsFilesWithDependencies
                }
            },
            withdepsdev: {
                options: {
                    compress: false,
                    mangle: false,
                    beautify: true,
                    preserveComments: 'some'
                },
                files: {
                    'dist/<%= pkg.name %>.<%= pkg.version %>.js': jsFilesWithDependencies,
                    '<%= pkg.name %>.js': jsFilesWithDependencies
                }
            },
        },
        watch: {
            js: {
                files: jsFiles,
                tasks: ['uglify']
            }
        }
    });

    // Load tasks
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
};
