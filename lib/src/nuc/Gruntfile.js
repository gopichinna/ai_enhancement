/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
module.exports = function (grunt) {
  if (process.env.GRUNT_TIME === 'true') {
    require('time-grunt')(grunt);
  }

  const requirejsModules = [
    { name: 'bundles/nuc-loader' },
    { name: 'bundles/nuc-libraries', exclude: ['bundles/nuc-loader'] },
    { name: 'bundles/nuc-log4javascript' },
    { name: 'bundles/nuc-lessc' },
    {
      name: 'bundles/nuc-server-adaptors',
      exclude: ['bundles/nuc-loader', 'bundles/nuc-libraries']
    },
    {
      name: 'bundles/nuc-models',
      exclude: ['bundles/nuc-loader', 'bundles/nuc-libraries', 'bundles/nuc-server-adaptors']
    }
  ];
  const requirejsBundleIndexes = {
    'bundles/nuc-index': [
      'bundles/nuc-libraries',
      'bundles/nuc-log4javascript',
      'bundles/nuc-lessc',
      'bundles/nuc-server-adaptors',
      'bundles/nuc-models'
    ]
  };

  grunt.config.init({
    smartuiCheck: {
      all: {
        options: {
          scripts: ['bundles/*.js', 'contexts/*.js', 'models/*.js', 'utils/**/*.js']
        }
      }
    },

    smartuiCompile: {
      all: {
        options: {
          bundles: requirejsModules,
          bundleIndexes: requirejsBundleIndexes,
          checkExceptions: ['txt', 'i18n', 'css', 'csui-ext', 'hbs', 'json', 'less'],
          fileExclusionRegExp:
            /(?:\blessc\.js$)|(?:\.spec\.js$)|(?:\bGruntfile\.js$)|(?:\bcomponent\.js$)|(?:\bgrunt-tasks\b$)/
        }
      }
    },

    smartuiPackage: {
      all: {}
    }
  });

  grunt.loadTasks('../node_modules/@smartui/grunt-support/tasks');

  grunt.registerTask('check', ['smartuiCheck:all:src']);
  grunt.registerTask('fix', ['smartuiCheck:all:fix']);
  grunt.registerTask('debug', ['smartuiCompile:all:debug', 'smartuiCheck:all:debug']);
  grunt.registerTask('release', ['smartuiCompile:all:release']);
  grunt.registerTask('package', ['smartuiPackage']);
  grunt.registerTask('default', ['check', 'debug', 'release', 'package']);
};
