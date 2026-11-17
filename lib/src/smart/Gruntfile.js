/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
const fs = require("fs");

const path = require("path");

const nucComponent = require("../lib/src/nuc/component");

const smartComponent = require("./component");

"use strict";

module.exports = grunt => {
  const environment = process.env;
  const time = environment.GRUNT_TIME === "true";
  const notify = environment.GRUNT_NOTIFY === "true";
  const pkg = grunt.file.readJSON("../package.json");
  const {
    generate: generateBuildNumber
  } = require("build-number-generator");
  const buildNumber = environment.BUILD || grunt.option("build") || generateBuildNumber(pkg.version);
  const isGruntForStorybook = !!grunt.option("grunt4SB");
  const generateBundelsForSB = isGruntForStorybook;
  if (time) {
    require("time-grunt")(grunt);
  }
  const requirejsModules = [ {
    name: "bundles/smart-all",
    exclude: nucComponent.getAllRequireJsPlugins().concat("smart/bundles/otwc/all").concat("css!smart/bundles/otwc/fonts"),
    include: generateBundelsForSB ? smartComponent.getAllAvailableRequireJsPlugins() : []
  }, {
    name: "bundles/icons-smart-action"
  }, {
    name: "bundles/icons-smart-action_16"
  } ];
  const modulesWeDependOn = [ ...nucComponent.getAllModules() ];
  var requirejsBundleIndex = {
    "bundles/smart-index": {
      src: [ "bundles/smart-all.js", "bundles/icons-smart-action.js", "bundles/icons-smart-action_16.js" ],
      dest: "bundles/smart-index",
      options: {
        prefix: "smart"
      }
    }
  };
  grunt.initConfig({
    notify_hooks: {
      options: {
        enabled: notify,
        max_jshint_notifications: 5,
        title: "smartcontrols/src",
        success: true,
        duration: 3
      }
    },
    requirejsBundleIndex: requirejsBundleIndex,
    requirejsBundleCheck: {
      all: {
        options: {
          prefix: "smart",
          dependencies: requirejsModules,
          config: "config-build.js"
        }
      }
    },
    requirejsDependencyCheck: {
      all: {
        options: {
          prefix: "smart",
          bundles: requirejsModules,
          dependencies: modulesWeDependOn,
          config: "config-build.js",
          bundleDir: "../out-debug"
        }
      }
    },
    requirejsIndexCheck: {
      all: {
        options: {
          rootDir: "../",
          bundles: requirejsModules,
          output: "../out-debug",
          bundleDir: "../out-debug"
        }
      }
    },
    requirejsCompile: {
      debug: {
        options: {
          rootDir: "../",
          dir: "../out-debug",
          bundles: requirejsModules,
          bundleDir: "../out-debug"
        }
      }
    },
    requirejsCopyRelease: {
      release: {
        options: {
          bundleIndexes: requirejsBundleIndex,
          debugDir: "../out-debug",
          releaseDir: "../out-release"
        }
      }
    },
    requirejsMinify: {
      release: {
        options: {
          bundles: requirejsModules,
          bundleIndexes: requirejsBundleIndex,
          bundleDir: "../out-release/"
        }
      }
    },
    requirejsCleanOutput: {
      release: {
        src: "../out-release"
      },
      debug: {
        src: "../out-debug"
      },
      options: {
        processItem: function(item, helpers) {
          if (item.name === "carbonfiber") {
            helpers.deleteFullDir(item.path + "/image/ot_icons");
            helpers.deleteFullDir(item.path + "/binf/css");
            helpers.deleteFullDir(item.path + "/tokens");
            helpers.deleteFile(item.path + "/binf/fonts/web.config");
            helpers.deleteFullDir(item.path + "/binf/css");
            helpers.deleteFullDir(item.path + "/fonts-source");
            helpers.deleteFullDir(item.path + "/fonts/specimen_files");
            if (fs.existsSync(item.path + "/fonts")) {
              fs.readdirSync(item.path + "/fonts").forEach(function(child) {
                if (/\.txt$/.test(child) || /\.html$/.test(child) || /\.css$/.test(child)) {
                  helpers.deleteFile(path.join(item.path + "/fonts", child));
                }
              });
            }
            fs.readdirSync(item.path).forEach(function(child) {
              if ((/\.css$/.test(child) || /\.map$/.test(child)) && (!/^theme/.test(child) && !/^init/.test(child))) {
                helpers.deleteFile(path.join(item.path, child));
              }
            });
            return true;
          }
        }
      }
    },
    jshint: {
      js: {
        src: [ "./**/*.js", "!./lib/**/*.js", "!./themes/**/*.js", "!./bundles/otwc/**/*.js" ],
        options: {
          jshintrc: "../.jshintrc",
          reporter: require("jshint-stylish")
        }
      },
      html: {
        src: [ "**/test/*.html" ],
        options: {
          jshintrc: "../.jshintrc-html",
          reporter: require("jshint-stylish"),
          extract: "auto"
        }
      }
    },
    eslint: {
      debug: [ "../out-debug/bundles/*.js" ],
      release: [ "../out-release/bundles/*.js" ]
    },
    stylelint: {
      source: {
        options: {
          stylelintrc: "../.stylelintrc"
        },
        src: [ "controls/**/*.css", "themes/**/*.css" ]
      },
      debug: {
        options: {
          stylelintrc: "../.stylelintrc"
        },
        src: [ "../out-debug/**/*.css", "!../out-debug/bundles/otwc/**/*.css" ]
      },
      release: {
        options: {
          stylelintrc: "../.stylelintrc"
        },
        src: [ "../out-release/**/*.css", "!../out-release/bundles/otwc/**/*.css" ]
      }
    },
    jsonlint: {
      source: [ "**/*.json" ],
      debug: [ "../out-debug/*.json" ],
      release: [ "../out-release/*.json" ]
    },
    override: {
      jshint: {
        options: {
          force: true
        }
      }
    },
    clean: {
      debug: [ "../out-debug/**", "./out-languagepack_en/**" ],
      release: [ "../out-release/**", "./out-languagepack_en/**" ],
      smart_svg_js: [ "themes/carbonfiber/smart.*.js" ],
      generated: [ "bundles/*-index.*" ],
      options: {
        force: true
      }
    },
    generateSVGs: {
      mimeTypeIconsWithColorSchema: {
        options: {
          iconNamePrefix: "csui_",
          nameMap: {
            tree_folder: "colorschema_mime_folder"
          }
        },
        files: [ {
          src: [ "themes/carbonfiber/image/icons.with.color.schema/*.svg" ],
          dest: "themes/carbonfiber/smart.mimetype.colorschema.icons.js"
        } ]
      },
      mimeTypeIcons: {
        options: {
          iconNamePrefix: "csui_",
          nameMap: {}
        },
        files: [ {
          src: [ "themes/carbonfiber/image/icons/mime_*.svg", "themes/carbonfiber/image/icons/smart_mime_*.svg", "themes/carbonfiber/image/icons/smart_*.svg" ],
          dest: "themes/carbonfiber/smart.mimetype.icons.js"
        } ]
      },
      actionIcons: {
        options: {
          iconNamePrefix: "csui_",
          extraCssClass: "csui-icon-v2-action-icon"
        },
        files: [ {
          src: [ "themes/carbonfiber/image/action_icons", "themes/carbonfiber/image/ot_icons/ot_action_icons" ],
          dest: "themes/carbonfiber/smart.action.icons.js"
        } ]
      }
    },
    replace: {
      options: {
        force: true,
        patterns: [ {
          match: /"version": "[.0-9]+"/g,
          replacement: '"version": "' + buildNumber + '"'
        } ]
      },
      debug: {
        files: [ {
          src: [ "smart-extensions.json" ],
          dest: "../out-debug/smart-extensions.json"
        }, {
          src: [ "lib/binf/js/binf.js" ],
          dest: "../out-debug/lib/binf/js/binf.js"
        } ]
      },
      release: {
        files: [ {
          src: [ "smart-extensions.json" ],
          dest: "../out-release/smart-extensions.json"
        }, {
          src: [ "lib/binf/js/binf.js" ],
          dest: "../out-release/lib/binf/js/binf.js"
        } ]
      }
    },
    languagepack: {
      all: {
        options: {
          prefix: "smart",
          config: "config-build.js",
          bundlesInfo: requirejsModules,
          bundles: [ {
            name: "bundles/smart-all",
            exclude: [ "..." ]
          } ],
          bundleIndexes: {
            "bundles/smart-index": [ "bundles/smart-all" ]
          },
          inputDir: "../out-debug",
          outputDir: "../out-languagepack_en"
        }
      }
    },
    rtlcss: {
      debug: {
        files: [ {
          expand: true,
          cwd: "../out-debug/bundles",
          src: [ "./*.css", "!./*-rtl.css" ],
          dest: "../out-debug/bundles/",
          rename: (dest, src) => dest + src.replace(".css", "-rtl.css")
        }, {
          expand: true,
          cwd: "../out-debug/themes/carbonfiber",
          src: [ "./*.css", "!./*-rtl.css" ],
          dest: "../out-debug/themes/carbonfiber/",
          rename: (dest, src) => dest + src.replace(".css", "-rtl.css")
        } ]
      },
      release: {
        files: [ {
          expand: true,
          cwd: "../out-release/bundles",
          src: [ "./*.css", "!./*-rtl.css" ],
          dest: "../out-release/bundles/",
          rename: (dest, src) => dest + src.replace(".css", "-rtl.css")
        }, {
          expand: true,
          cwd: "../out-release/themes/carbonfiber",
          src: [ "./*.css", "!./*-rtl.css" ],
          dest: "../out-release/themes/carbonfiber/",
          rename: (dest, src) => dest + src.replace(".css", "-rtl.css")
        } ]
      }
    },
    cssmin: {
      options: {
        report: "min",
        sourceMap: true,
        level: {
          1: {
            all: false
          }
        }
      },
      release: {
        files: [ {
          expand: true,
          cwd: "../out-release/themes/carbonfiber",
          src: [ "*.css", "!*.min.css" ],
          dest: "../out-release/themes/carbonfiber"
        } ]
      }
    },
    copy: {
      svg: {
        src: [ "themes/carbonfiber/*.js" ],
        dest: "../out-release/"
      }
    }
  });
  grunt.loadTasks("../node_modules/@prantlf/grunt-contrib-requirejs/tasks");
  grunt.loadTasks("../node_modules/grunt-contrib-clean/tasks");
  grunt.loadTasks("../node_modules/grunt-contrib-copy/tasks");
  grunt.loadTasks("../node_modules/grunt-contrib-jshint/tasks");
  grunt.loadTasks("../node_modules/grunt-contrib-cssmin/tasks");
  grunt.loadTasks("../node_modules/grunt-contrib-compress/tasks");
  grunt.loadTasks("../node_modules/grunt-eslint/tasks");
  grunt.loadTasks("../node_modules/grunt-jsonlint/tasks");
  grunt.loadTasks("../node_modules/@smartui/grunt-support/tasks");
  grunt.loadTasks("../node_modules/grunt-notify/tasks");
  grunt.loadTasks("../node_modules/grunt-override-config/tasks");
  grunt.loadTasks("../node_modules/grunt-replace/tasks");
  grunt.loadTasks("../node_modules/grunt-rtlcss/tasks");
  grunt.loadTasks("../node_modules/grunt-stylelint/tasks");
  grunt.registerTask("check", [ "jshint", "jsonlint:source", "stylelint:source" ]);
  grunt.registerTask("generate-before", [ "clean:smart_svg_js", "generateSVGs", "requirejsBundleIndex" ]);
  grunt.registerTask("generate-after", [ "clean:generated" ]);
  grunt.registerTask("finish-debug", [ "requirejsCompile:debug", "requirejsCleanOutput:debug", "requirejsIndexCheck", "requirejsBundleCheck", "requirejsDependencyCheck", "languagepack", "replace:debug", "jsonlint:debug", "rtlcss:debug", "stylelint:debug" ]);
  grunt.registerTask("debug", [ "clean:debug", "generate-before", "finish-debug", "generate-after" ]);
  let releaseGruntTasks = [ "requirejsCopyRelease:release", "requirejsMinify:release", "requirejsCleanOutput:release", "copy:svg", "replace:release", "jsonlint:release", "rtlcss:release", "cssmin:release", "stylelint:release" ];
  grunt.registerTask("finish-release", releaseGruntTasks);
  grunt.registerTask("release", [ "clean:release", "generate-before", "finish-release", "generate-after" ]);
  grunt.registerTask("debug-and-release", [ "clean:debug", "clean:release", "generate-before", "finish-debug", "finish-release", "generate-after" ]);
  grunt.registerTask("default", [ "check", "debug", "release" ]);
  grunt.task.run("notify_hooks");
};