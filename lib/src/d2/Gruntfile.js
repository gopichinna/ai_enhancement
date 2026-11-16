/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
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
  } = grunt.file.readJSON("../package.json"), build = process.env.BUILD || generateBuildNumber(pkgVersion), otIconBundler = require("@smartui/ot-icons-bundler"), moduleAliasesToExclude = [], dependentModules = [];
  svfDependencies.forEach(depName => {
    const compDescriptor = require(`../lib/src/${depName}/component`);
    _.isFunction(compDescriptor.getAllRequireJsPlugins) && Array.prototype.push.apply(moduleAliasesToExclude, compDescriptor.getAllRequireJsPlugins());
    _.isFunction(compDescriptor.getAllModules) && Array.prototype.push.apply(dependentModules, compDescriptor.getAllModules());
  });
  const requirejsModules = [ {
    name: "bundles/d2-core",
    exclude: [ ...moduleAliasesToExclude ]
  }, {
    name: "bundles/d2-desktop",
    exclude: [ ...moduleAliasesToExclude, "bundles/d2-core", "d2/sdk/controls/form/form.model", "d2/sdk/models/node.model", "d2/sdk/models/mixins/browsable.collection.mixin", "d2/sdk/models/mixins/collection.resource.mixin" ]
  }, {
    name: "bundles/d2-test",
    exclude: [ ...moduleAliasesToExclude, "bundles/d2-core", "bundles/d2-desktop" ]
  }, {
    name: "bundles/d2-sdk",
    exclude: [ ...moduleAliasesToExclude, "bundles/d2-core", "bundles/d2-desktop", "bundles/d2-test" ]
  } ], requirejsBundleIndexes = {
    "bundles/d2-core-index": [ "bundles/d2-core" ],
    "bundles/d2-desktop-index": [ "bundles/d2-desktop", "bundles/d2-sdk" ]
  };
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
      all: {
        options: {
          rootDir: "..",
          srcDir: "../src",
          prefix: svfName,
          dependencies: svfDependencies,
          map: {
            "*": {
              "d2/utils/sort.utils": "dctmw/utils/sort.utils"
            }
          }
        }
      }
    },
    clean: {
      options: {
        force: true
      },
      generated: [ "bundles/*-index.*", "bundles/*-specs*" ],
      debug: [ "../out-debug/**", "../out-languagepack_en/**" ],
      specs: [ "../out-specs" ],
      release: [ "../out-release/**" ],
      page: [ "../out-page/**" ],
      "appworks-inner": [ "../dist/mobile.zip" ],
      "appworks-props": [ "../dist/app.properties" ],
      dist: [ "../dist" ],
      all: [ "../out-debug", "../out-specs", "../out-release", "../out-languagepack_en" ],
      buildManifest: [ "../dist/build.properties" ]
    },
    copy: {
      debug: {
        files: [ {
          src: [ "d2-init.js" ],
          dest: "../out-debug/"
        } ]
      },
      release: {
        files: [ {
          src: [ "d2-init.js" ],
          dest: "../out-release/"
        } ]
      }
    },
    replace: {
      debug: {
        options: {
          force: true,
          patterns: [ {
            match: /"version": "1.0"/g,
            replacement: '"version": "' + build + '"'
          } ]
        },
        files: [ {
          src: [ "d2-startup-extensions.json", "d2-core-extensions.json", "d2-desktop-extensions.json", "overrides/lang.json" ],
          dest: "../out-debug/"
        } ]
      },
      release: {
        options: {
          force: true,
          patterns: [ {
            match: /"version": "1.0"/g,
            replacement: '"version": "' + build + '"'
          } ]
        },
        files: [ {
          src: [ "d2-startup-extensions.json", "d2-core-extensions.json", "d2-desktop-extensions.json", "overrides/lang.json" ],
          dest: "../out-release/"
        } ]
      }
    },
    jsonlint: {
      debug: [ "../out-debug/*.json" ],
      release: [ "../out-release/*.json" ],
      page: [ "../out-page/*.json" ]
    },
    generateSVGs: {
      actionIcons: {
        options: {
          iconNamePrefix: "d2_"
        },
        files: [ {
          src: "utils/theme/image/action_icons",
          dest: "utils/theme/action_icons.js"
        } ]
      }
    },
    smartuiCheck: {
      all: {
        options: {
          scripts: [ "*/**/*.js", "!lib/**", "!grunt-tasks/**", "!overrides/csrviewer/**", "!utils/antlr/**", "!./Gruntfile.js", "!./component.js", "!./config-build.js" ],
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
          checkExceptions: [ "csui/pages/start/impl/navigationheader/impl/navigationheader", "dctmw/ctf/ctf" ],
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
  grunt.registerTask("genOtIcons", "Generating OT icons from D2 Theme SVGs", function() {
    let done = this.async();
    otIconBundler("d2_action", "d2_action", "utils/theme/image/action_icons/*.svg", "utils/theme").then(() => {
      done();
    });
  });
  grunt.registerTask("check", [ "smartuiEnsureDirSymlink", "smartuiGenerateBuildConfig", "generateSVGs", "genOtIcons", "smartuiCheck:all:src" ]);
  grunt.registerTask("fix", [ "smartuiCheck:all:fix" ]);
  grunt.registerTask("debug", [ "smartuiCompile:all:debug", "replace:debug", "copy:debug", "smartuiInjectCssBundle" ]);
  grunt.registerTask("release", [ "smartuiCompile:all:release", "replace:release", "copy:release" ]);
  grunt.registerTask("package", [ "clean:dist", "smartuiPackage:all:languagepack_en" ]);
  grunt.registerTask("default", [ "check", "debug", "release" ]);
  grunt.registerTask("debug_specs", [ "clean:specs", "clean:generated", "generateRequireJSBundle", "copy:spec_deps", "requirejsCompile:specs", "requirejsCleanOutput:specs", "requirejsDependencyCheck:specs", "clean:generated", "clean:specs" ]);
};