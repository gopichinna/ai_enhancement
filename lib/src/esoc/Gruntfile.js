/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

var fs = require("fs"), path = require("path");

module.exports = function(grunt) {
  require("time-grunt")(grunt);
  var nucPath = path.join(__dirname, "../lib/src/nuc"), smartPath = path.join(__dirname, "../lib/src/smart"), nucGruntTasks = path.join(nucPath, "/grunt-tasks"), nucComponent = require(path.join(nucPath, "/component")), smartComponent = require(path.join(smartPath, "/component")), moduleAliasesToExclude = nucComponent.getAllRequireJsPlugins().concat(smartComponent.getAllRequireJsPlugins()), requirejsBundleIndexes = {
    "bundles/esoc-index": [ "bundles/esoc-all" ]
  }, requirejsModules = [ {
    name: "bundles/esoc-all",
    exclude: moduleAliasesToExclude
  } ];
  require("../lib/src/nuc/grunt-tasks/utils/create.build.config")({
    prefix: "esoc",
    dependencies: [ "csui", "nuc", "smart" ]
  });
  grunt.initConfig({
    requirejsBundleIndex: {
      all: {
        options: {
          bundleIndexes: requirejsBundleIndexes
        }
      }
    },
    requirejs: {
      debug: {
        options: {
          mainConfigFile: "config-build.js",
          namespace: "csui",
          separateCSS: true,
          appDir: ".",
          baseUrl: ".",
          siteRoot: ".",
          fileExclusionRegExp: /(?:\.spec\.js$)|(?:\bGruntfile\.js$)/,
          dir: "../out-debug",
          optimize: "none",
          modules: requirejsModules
        }
      },
      release: {
        options: {
          mainConfigFile: "config-build.js",
          namespace: "csui",
          separateCSS: true,
          appDir: ".",
          baseUrl: ".",
          siteRoot: ".",
          fileExclusionRegExp: /(?:\.spec\.js$)|(?:\bGruntfile\.js$)/,
          dir: "../out-release",
          compressCSS: true,
          optimize: "uglify2",
          uglify2: {
            output: {
              ascii_only: true,
              quote_keys: true
            }
          },
          generateSourceMaps: true,
          preserveLicenseComments: false,
          modules: requirejsModules
        }
      }
    },
    copy: {
      theme: {
        files: [ {
          cwd: "../out-debug",
          src: [ "bundles/**/*.css" ],
          dest: "../../../obj/DEBUG/custom_theme/esoc/",
          expand: true,
          filter: "isFile"
        }, {
          cwd: "../../../obj/DEBUG/esocial/",
          src: [ "images/**", "lib/**/*.png", "lib/**/*.svg", "widgets/**/*.png", "widgets/**/*.svg" ],
          dest: "../../../obj/DEBUG/custom_theme/esoc/",
          expand: true,
          filter: "isFile"
        } ]
      }
    },
    jshint: {
      all: [ "../Gruntfile.js", "Gruntfile.js", "*.js", "bundles/**/*.js", "widgets/**/*.js", "../test/*.js", "!./Gruntfile.js", "!./component.js", "!./config-build.js" ],
      options: {
        jshintrc: "../.jshintrc"
      }
    },
    jsonlint: {
      source: [ "*.json" ],
      debug: [ "../out-debug/*.json" ],
      release: [ "../out-release/*.json" ]
    },
    clean: {
      generated: [ "bundles/esoc-index.*" ],
      debug: {
        files: [ {
          expand: true,
          filter: "isFile",
          src: [ "../out-debug/*", "!../out-debug/esoc-extensions.json" ]
        } ]
      },
      release: {
        src: [ "*", "!esoc-extensions.json", "!bundles", "!images", "!lib", "!widgets", "bundles/*.md", "bundles/*.src.js", "lib/*", "!lib/jquery.emojiarea", "!lib/jquery.ui", "lib/jquery.emojiarea/*", "!lib/jquery.emojiarea/packs", "lib/jquery.emojiarea/packs/*", "!lib/jquery.emojiarea/packs/basic", "!lib/jquery.emojiarea/packs/custom", "lib/jquery.emojiarea/packs/basic/*.js", "lib/jquery.emojiarea/packs/basic/*.map", "lib/jquery.emojiarea/packs/custom/*.js", "lib/jquery.emojiarea/packs/custom/*.map", "lib/jquery.ui/*", "!lib/jquery.ui/themes", "lib/jquery.ui/themes/*", "!lib/jquery.ui/themes/opentext", "lib/jquery.ui/themes/opentext/*", "!lib/jquery.ui/themes/opentext/images", "widgets/*", "!widgets/common", "widgets/common/*", "!widgets/common/images", "!widgets/socialactions", "widgets/socialactions/*", "!widgets/socialactions/font", "!widgets/socialactions/images", "!widgets/tablecell", "widgets/tablecell/*", "!widgets/tablecell/impl", "widgets/tablecell/impl/*.css", "widgets/tablecell/impl/*.hbs", "!widgets/userwidget", "widgets/userwidget/*", "!widgets/userwidget/images" ].map(function(path) {
          if (path[0] === "!") {
            return "!../out-release/" + path.substring(1);
          }
          return "../out-release/" + path;
        })
      },
      options: {
        force: true
      }
    },
    languagepack: {
      all: {
        options: {
          bundles: requirejsModules,
          bundleIndexes: requirejsBundleIndexes
        }
      }
    },
    rtlcss: {
      debugRTLcss: {
        expand: true,
        cwd: "../out-debug/bundles",
        src: "./*.css",
        dest: "../out-debug/bundles/",
        rename: function(dest, src) {
          return dest + src.replace(".css", "-rtl.css");
        }
      },
      releaseRTLcss: {
        expand: true,
        cwd: "../out-release/bundles",
        src: "./*.css",
        dest: "../out-release/bundles/",
        rename: function(dest, src) {
          return dest + src.replace(".css", "-rtl.css");
        }
      }
    }
  });
  grunt.file.expand("../node_modules/grunt-*/tasks").forEach(grunt.loadTasks);
  grunt.loadTasks(nucGruntTasks);
  grunt.registerTask("check", [ "jshint" ]);
  grunt.registerTask("debug", [ "check", "requirejsBundleIndex", "requirejs:debug", "clean:generated", "clean:debug", "rtlcss:debugRTLcss", "languagepack", "copy:theme" ]);
  grunt.registerTask("release", [ "check", "requirejsBundleIndex", "requirejs:release", "clean:generated", "clean:release", "rtlcss:releaseRTLcss" ]);
  grunt.registerTask("default", [ "debug", "release" ]);
};