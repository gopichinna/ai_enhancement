'use strict';

module.exports = function (grunt) {
  const
    _ = require('lodash'),
    generateBuildNumber = require('@smartui/grunt-support/utils/generate.build.number'),
    {version: pkgVersion, svf:{name: svfName}} = grunt.file.readJSON('../package.json'),
    svfDependencies = require('@dctm/dctm-web-tools/utils/svf.helper').getCompleteSVFDependencies(),
    build = process.env.BUILD || generateBuildNumber(pkgVersion),

    moduleAliasesToExclude = [],
    dependentModules = [],

    requirejsModules = [{
      name: `bundles/${svfName}-bundle`,
      exclude: moduleAliasesToExclude
    }],

    requirejsBundles = [
      `bundles/${svfName}-bundle`
    ],

    requirejsBundleIndexes = {};

  requirejsBundleIndexes[`bundles/${svfName}-index`] = requirejsBundles;
  svfDependencies.forEach((depName) => {
    const compDescriptor = require(`../lib/src/${depName}/component`);
    _.isFunction(compDescriptor.getAllRequireJsPlugins) && Array.prototype.push.apply(moduleAliasesToExclude, compDescriptor.getAllRequireJsPlugins());
    _.isFunction(compDescriptor.getAllModules) && Array.prototype.push.apply(dependentModules, compDescriptor.getAllModules());
  });

  grunt.initConfig({
    smartuiEnsureDirSymlink: {
      source: {
        options: {
          ensureSrcDir: false
        },
        src: '.',
        dest: `../lib/src/${svfName}`
      },
      debug: {
        src: '../out-debug',
        dest: `../lib/debug/${svfName}`
      },
      release: {
        src: '../out-release',
        dest: `../lib/release/${svfName}`
      }
    },

    smartuiGenerateBuildConfig: {
      all: {
        options: {
          rootDir: '..',
          srcDir: '../src',
          prefix: svfName,
          dependencies: svfDependencies
        }
      }
    },

    generateSVGs: {
      actionIcons: {
        options: {
          iconNamePrefix: svfName
        },
        files: [
          {
            src: 'utils/theme/action_icons',
            dest: 'utils/theme/action.icons.js'
          }
        ]
      }
    },

    smartuiCheck: {
      all: {
        options: {
          scripts: [
            '*/**/*.js',
            '!lib/**',
            '!./Gruntfile.js',
            '!./component.js',
            '!./config-build.js'
          ],
          stylesheets: ['**/*.css'],
          pages: ['../pages/**/*.html', '**/*.hbs']
        }
      }
    },

    smartuiCompile: {
      all: {
        options: {
          bundles: requirejsModules,
          bundleIndexes: requirejsBundleIndexes,
          allowIndexedPrivateModules: true,
          checkExceptions: [
            'dctm-ext',
            'd2-ext'
          ],
          moduleDependencies: dependentModules,
          prefix: svfName
        }
      }
    },

    smartuiPackage: {
      all: {
        options: {
          prefix: svfName
        }
      }
    },

    clean: {
      options: {
        force: true
      },
      generated: [
        'bundles/*-index.*'
      ],
      dist: [
        '../dist'
      ],
      all: [
        '../out-debug',
        '../out-release',
        '../out-page',
        '../out-languagepack_en'
      ]
    },

    copy: {
      debug: {
        files: [{
          src: [
            `${svfName}-extensions.json`,
            `${svfName}-init.js`
          ],
          dest: '../out-debug/'
        }]
      },
      release: {
        files: [{
          src: [
            `${svfName}-extensions.json`,
            `${svfName}-init.js`
          ],
          dest: '../out-release/'
        }]
      }
    },

    smartuiInjectCssBundle: {
      options: {
        prefix: svfName
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('@smartui/grunt-support');
  grunt.loadNpmTasks('@dctm/dctm-web-tools');

  grunt.registerTask('check', ['smartuiEnsureDirSymlink', 'smartuiGenerateBuildConfig', 'generateSVGs', 'smartuiCheck:all:src']);
  grunt.registerTask('debug', ['smartuiCompile:all:debug', 'copy:debug', 'smartuiInjectCssBundle']);
  grunt.registerTask('release', ['smartuiCompile:all:release', 'copy:release']);

  grunt.registerTask('default', ['check', 'debug', 'release']);

  grunt.registerTask('package', ['clean:dist', 'smartuiPackage:all:languagepack_en']);
};
