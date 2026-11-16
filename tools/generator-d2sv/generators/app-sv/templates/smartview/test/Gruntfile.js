'use strict';

module.exports = function (grunt) {

  grunt.initConfig({

    subgrunt: {
      check: {
        '../src': ['check']
      },
      options: {
        npmInstall: false
      }
    },

    clean: {
      options: {
        force: true
      },
      debug: ['../out-test/debug'],
      release: ['../out-test/release'],
      all: ['../out-test']
    },

    mkdir: {
      debug: {
        options: {
          create: ['../out-test/debug/coverage', '../out-test/debug/results']
        }
      },
      release: {
        options: {
          create: ['../out-test/release/results']
        }
      }
    },

    karma: {
      options: {
        configFile: 'karma.conf.js',
        dctmKarmaConf: {
          basePath: '..'
        }
      },
      debug: {
        client: {
          args: ['debug']
        }
      },
      debug_interactive: {
        dctmKarmaConf: {
          browsers: ['Chrome'],
          reporters: ['progress'],
          singleRun: false
        },
        client: {
          args: ['debug']
        }
      },
      release: {
        client: {
          args: []
        }
      }
    },

    smartuiTestCovJsonToCSV: {}
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-subgrunt');
  grunt.loadNpmTasks('@dctm/dctm-web-tools');

  grunt.registerTask('check', ['subgrunt:check']);
  grunt.registerTask('debug', ['mkdir:debug', 'clean:debug', 'karma:debug', 'smartuiTestCovJsonToCSV']);
  grunt.registerTask('release', ['mkdir:release', 'clean:release', 'karma:release']);
  grunt.registerTask('specs', ['debug', 'release']);
  grunt.registerTask('interactive', ['check', 'mkdir:debug', 'clean:debug', 'karma:debug_interactive']);
  grunt.registerTask('default', ['check', 'specs']);
};
