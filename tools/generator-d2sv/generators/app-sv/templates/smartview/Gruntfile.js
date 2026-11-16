'use strict';

module.exports = function (grunt) {

  grunt.initConfig({
    subgrunt: {
      clean: {
        src: 'clean',
        test: 'clean:all'
      },
      check: {
        src: 'check'
      },
      compile: ['src'],
      test: ['test'],
      'test_interactive': {
        'test': 'interactive'
      },
      specs: {
        test: 'specs'
      },
      package: {
        src: 'package'
      },
      generateBuildConfig: {
        src: 'smartuiGenerateBuildConfig'
      },
      ensureDirSymlink: {
        src: 'smartuiEnsureDirSymlink'
      },
      options: {
        npmInstall: false
      }
    }
  });

  grunt.loadNpmTasks('grunt-subgrunt');

  grunt.registerTask('clean', ['subgrunt:clean']);
  grunt.registerTask('check', ['subgrunt:check']);
  grunt.registerTask('compile', ['subgrunt:compile']);
  grunt.registerTask('test', ['subgrunt:test']);
  grunt.registerTask('test-interactive', ['subgrunt:test_interactive']);
  grunt.registerTask('specs', ['subgrunt:specs']);
  grunt.registerTask('generateBuildConfig', ['subgrunt:generateBuildConfig']);
  grunt.registerTask('ensureDirSymlink', ['subgrunt:ensureDirSymlink']);
  grunt.registerTask('default', ['subgrunt:compile', 'subgrunt:specs']);
  grunt.registerTask('package', ['default', 'subgrunt:package']);
};
