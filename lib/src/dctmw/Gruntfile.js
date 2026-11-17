/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

module.exports = function(grunt) {
  const {
    GRUNT_TIME
  } = process.env, time = GRUNT_TIME === "true";
  if (time) {
    require("time-grunt")(grunt);
  }
  const _ = require("underscore"), svfDependencies = require("@dctm/dctm-web-tools/utils/svf.helper").getCompleteSVFDependencies(), generateBuildNumber = require("@smartui/grunt-support/utils/generate.build.number"), {
    version: pkgVersion,
    svf: {
      name: svfName
    }
  } = grunt.file.readJSON("../package.json"), build = process.env.BUILD || generateBuildNumber(pkgVersion), moduleAliasesToExclude = [], dependentModules = [];
  svfDependencies.forEach(depName => {
    const compDescriptor = require(`../lib/src/${depName}/component`);
    _.isFunction(compDescriptor.getAllRequireJsPlugins) && Array.prototype.push.apply(moduleAliasesToExclude, compDescriptor.getAllRequireJsPlugins());
    _.isFunction(compDescriptor.getAllModules) && Array.prototype.push.apply(dependentModules, compDescriptor.getAllModules());
  });
  const requirejsModules = [ {
    name: `bundles/${svfName}-all`,
    exclude: moduleAliasesToExclude
  }, {
    name: `bundles/${svfName}-test`,
    exclude: [ ...moduleAliasesToExclude, `bundles/${svfName}-all` ]
  } ], requirejsBundles = [ `bundles/${svfName}-all` ], requirejsBundleIndexes = {};
  requirejsBundleIndexes[`bundles/${svfName}-index`] = requirejsBundles;
  grunt.initConfig({
    smartuiEnsureDirSymlink: {
      source: {
        options: {
          ensureSrcDir: false
        },
        src: ".",
        dest: `../lib/src/${svfName}`
      },
      debug: {
        src: "../out-debug",
        dest: `../lib/debug/${svfName}`
      },
      release: {
        src: "../out-release",
        dest: `../lib/release/${svfName}`
      }
    },
    smartuiGenerateBuildConfig: {
      options: {
        rootDir: "..",
        srcDir: "../src",
        paths: {
          "dctm-ext": "utils/load-extensions/load-extensions"
        },
        map: {
          "*": {
            "dctmw/models/stm.server.adaptor.mixin": "dctmw/server.adaptors/models/dctmw/dctm.stm.server.adaptor.mixin",
            "smart/mixins/view.events.propagation/view.events.propagation.mixin": "dctmw/controls/mixins/view.events.propagation.mixin",
            "smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin": "dctmw/controls/mixins/layoutview.events.propagation.mixin"
          }
        }
      },
      all: {
        options: {
          prefix: svfName,
          dependencies: svfDependencies
        }
      }
    },
    smartuiCheck: {
      all: {
        options: {
          scripts: [ "*/**/*.js", "!lib/**", "!grunt-tasks/**", "!./Gruntfile.js", "!./component.js", "!./config-build.js" ],
          stylesheets: [ "**/*.css" ],
          pages: [ "../pages/**/*.html", "**/*.hbs" ]
        }
      }
    },
    smartuiCompile: {
      all: {
        options: {
          bundles: requirejsModules,
          bundleIndexes: requirejsBundleIndexes,
          allowIndexedPrivateModules: true,
          checkExceptions: [ "dctm-ext", "csui/pages/start/impl/navigationheader/impl/navigationheader", "csui/pages/start/impl/landing.perspective.router" ],
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
      generated: [ "bundles/*-index.*" ],
      page: [ "../out-page/**" ],
      dist: [ "../dist" ],
      all: [ "../out-debug", "../out-release", "../out-page", "../out-languagepack_en" ]
    },
    copy: {
      debug: {
        files: [ {
          src: [ `${svfName}-extensions.json`, "lib/oah/OpenAjaxManagedHub-all.js", "lib/oah/DCTM-OAH.js" ],
          dest: "../out-debug/"
        } ]
      },
      release: {
        files: [ {
          src: [ `${svfName}-extensions.json`, "lib/oah/OpenAjaxManagedHub-all.js", "lib/oah/DCTM-OAH.js" ],
          dest: "../out-release/"
        } ]
      },
      page: {
        files: [ {
          expand: true,
          cwd: "../pages",
          src: [ "*.*", "!config-dev.js" ],
          dest: "../out-page"
        } ]
      }
    },
    uglify: {
      options: {
        mangle: {
          reserved: [ "addBundleIndex", "addBootReadyCallback", "addExtension", "bootHold", "handleError", "C_VERSION" ]
        },
        compress: false
      },
      page: {
        files: [ {
          expand: true,
          cwd: ".",
          src: [ "*.js", "!config-build.js", "!Gruntfile.js" ],
          dest: "../out-release"
        }, {
          expand: true,
          cwd: "../out-page",
          src: [ "*.js" ],
          dest: "../out-page"
        } ]
      }
    },
    generateDctmwJatoSVGBundle: {
      options: {
        prefix: `${svfName}_`
      }
    },
    smartuiInjectCssBundle: {
      options: {
        prefix: svfName
      }
    }
  });
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-compress");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-replace");
  grunt.loadNpmTasks("@smartui/grunt-support");
  grunt.loadNpmTasks("@dctm/dctm-web-tools");
  grunt.registerTask("page", [ "clean:page", "copy:page", "uglify:page" ]);
  grunt.registerTask("check", [ "smartuiEnsureDirSymlink", "smartuiGenerateBuildConfig", "generateDctmwJatoSVGBundle", "smartuiCheck:all:src" ]);
  grunt.registerTask("debug", [ "smartuiCompile:all:debug", "copy:debug", "smartuiInjectCssBundle" ]);
  grunt.registerTask("release", [ "smartuiCompile:all:release", "copy:release", "page" ]);
  grunt.registerTask("default", [ "check", "debug", "release" ]);
  grunt.registerTask("package", [ "clean:dist", "smartuiPackage:all:languagepack_en" ]);
};