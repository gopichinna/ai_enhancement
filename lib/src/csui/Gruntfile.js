/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const fs = require("fs");

const path = require("path");

module.exports = function(grunt) {
  const {
    env
  } = process;
  const time = env.GRUNT_TIME === "true" || grunt.option("time");
  if (time) {
    require("time-grunt")(grunt);
  }
  const nucPath = path.join(__dirname, "../lib/src/nuc");
  const smartPath = path.join(__dirname, "../lib/src/smart");
  const nucComponent = require(path.join(nucPath, "component"));
  const smartComponent = require(path.join(smartPath, "component"));
  const moduleAliasesToExclude = nucComponent.getAllRequireJsPlugins().concat(smartComponent.getAllRequireJsPlugins());
  const modulesWeDependOn = nucComponent.getAllModules().concat(smartComponent.getAllModules());
  const {
    generate: generateBuildNumber
  } = require("build-number-generator");
  const pkg = grunt.file.readJSON("../package.json");
  const build = env.BUILD || grunt.option("build") || generateBuildNumber(pkg.version);
  const requirejsModules = [ {
    name: "bundles/csui-helpers"
  }, {
    name: "bundles/csui-signin",
    exclude: moduleAliasesToExclude
  }, {
    name: "bundles/csui-error",
    exclude: moduleAliasesToExclude
  }, {
    name: "bundles/csui-libraries",
    exclude: moduleAliasesToExclude
  }, {
    name: "bundles/csui-server-adaptors",
    exclude: moduleAliasesToExclude.concat([ "bundles/csui-libraries" ])
  }, {
    name: "bundles/csui-models",
    exclude: moduleAliasesToExclude.concat([ "bundles/csui-libraries", "bundles/csui-server-adaptors" ])
  }, {
    name: "bundles/csui-commands",
    exclude: moduleAliasesToExclude.concat([ "bundles/csui-libraries", "bundles/csui-server-adaptors", "bundles/csui-models" ])
  }, {
    name: "bundles/csui-data",
    exclude: moduleAliasesToExclude.concat([ "bundles/csui-libraries", "bundles/csui-server-adaptors", "bundles/csui-models", "bundles/csui-commands" ]),
    include: [ "csui/pages/start/impl/perspective.factory", "csui/pages/start/impl/perspective.router", "csui/pages/start/impl/perspective.panel/perspective.animator", "csui/pages/start/impl/perspective.panel/perspective.panel.view" ]
  }, {
    name: "bundles/csui-view-support",
    exclude: moduleAliasesToExclude.concat([ "bundles/csui-libraries", "bundles/csui-server-adaptors", "bundles/csui-models", "bundles/csui-commands", "bundles/csui-data" ])
  }, {
    name: "bundles/csui-forms",
    exclude: moduleAliasesToExclude.concat([ "bundles/csui-libraries", "bundles/csui-server-adaptors", "bundles/csui-models", "bundles/csui-commands", "bundles/csui-data", "bundles/csui-view-support" ])
  }, {
    name: "bundles/csui-app",
    exclude: moduleAliasesToExclude.concat([ "bundles/csui-libraries", "bundles/csui-server-adaptors", "bundles/csui-models", "bundles/csui-commands", "bundles/csui-data", "bundles/csui-view-support", "bundles/csui-forms", "csui/lib/froala_editor/js/froala_editor.pkgd.min" ])
  }, {
    name: "bundles/csui-browse",
    exclude: moduleAliasesToExclude.concat([ "bundles/csui-libraries", "bundles/csui-server-adaptors", "bundles/csui-models", "bundles/csui-commands", "bundles/csui-data", "bundles/csui-view-support", "bundles/csui-forms", "bundles/csui-app" ])
  }, {
    name: "bundles/csui-metadata",
    exclude: moduleAliasesToExclude.concat([ "bundles/csui-libraries", "bundles/csui-server-adaptors", "bundles/csui-models", "bundles/csui-commands", "bundles/csui-data", "bundles/csui-view-support", "bundles/csui-forms", "bundles/csui-app", "bundles/csui-browse" ])
  }, {
    name: "bundles/csui-search",
    exclude: moduleAliasesToExclude.concat([ "bundles/csui-libraries", "bundles/csui-server-adaptors", "bundles/csui-models", "bundles/csui-commands", "bundles/csui-data", "bundles/csui-view-support", "bundles/csui-forms", "bundles/csui-app", "bundles/csui-browse", "bundles/csui-metadata" ])
  }, {
    name: "bundles/csui-visualisation",
    optimize: "none",
    exclude: moduleAliasesToExclude.concat([ "bundles/csui-libraries", "bundles/csui-server-adaptors", "bundles/csui-models", "bundles/csui-commands", "bundles/csui-data", "bundles/csui-view-support", "bundles/csui-forms", "bundles/csui-app", "bundles/csui-browse", "bundles/csui-metadata", "bundles/csui-search" ])
  }, {
    name: "bundles/csui-perspective",
    exclude: moduleAliasesToExclude.concat([ "bundles/csui-libraries", "bundles/csui-server-adaptors", "bundles/csui-models", "bundles/csui-commands", "bundles/csui-data", "bundles/csui-view-support", "bundles/csui-forms", "bundles/csui-app", "bundles/csui-browse", "bundles/csui-metadata", "bundles/csui-search", "bundles/csui-visualisation" ])
  }, {
    name: "bundles/csui-icons-controls",
    exclude: moduleAliasesToExclude.concat([ "bundles/csui-libraries", "bundles/csui-models", "bundles/csui-data" ])
  }, {
    name: "bundles/csui-icons-actions"
  }, {
    name: "bundles/csui-ot-icons"
  }, {
    name: "bundles/csui-icons-mimetype"
  }, {
    name: "bundles/csui-icons-mimetype-colorschema"
  }, {
    name: "bundles/csui-alpaca-legacy",
    exclude: moduleAliasesToExclude.concat([ "bundles/csui-libraries", "bundles/csui-forms" ])
  } ];
  const requirejsBundleIndexes = {
    "bundles/csui-signin-index": [ "bundles/csui-signin" ],
    "bundles/csui-error-index": [ "bundles/csui-error" ],
    "bundles/csui-app-index": [ "bundles/csui-libraries", "bundles/csui-models", "bundles/csui-server-adaptors", "bundles/csui-commands", "bundles/csui-data", "bundles/csui-app", "bundles/csui-view-support", "bundles/csui-browse", "bundles/csui-forms", "bundles/csui-metadata", "bundles/csui-search", "bundles/csui-visualisation", "bundles/csui-perspective", "bundles/csui-icons-controls", "bundles/csui-icons-actions", "bundles/csui-ot-icons", "bundles/csui-icons-mimetype", "bundles/csui-icons-mimetype-colorschema", "bundles/csui-alpaca-legacy" ],
    "bundles/csui-core-index": [ "bundles/csui-libraries", "bundles/csui-models", "bundles/csui-server-adaptors", "bundles/csui-commands", "bundles/csui-data", "bundles/csui-view-support", "bundles/csui-forms", "bundles/csui-search", "bundles/csui-icons-controls", "bundles/csui-icons-actions", "bundles/csui-ot-icons", "bundles/csui-icons-mimetype" ]
  };
  function writeStamps(moduleName, path, contents) {
    if (moduleName === "helpers" || moduleName === "csui/helpers") {
      grunt.verbose.writeln(`Writing build number to ${moduleName} : ${build}`);
      contents = contents.replace(/return '1\.0\.0\.0';/g, `return '${build}';`);
    }
    if (moduleName === "csui/lib/d3") {
      grunt.verbose.writeln("Renaming local define functions in", moduleName);
      contents = contents.replace(/\bdefine\((\s*)(?!function\b|'|{)/g, "csuiDefine($1").replace(/\b(var\s+)define(\s*=\s*(?:function\b|require\b))\b/g, "$1csuiDefine$2").replace(/\b(function\s+)define\b/g, "$1csuiDefine").replace(/\bdefine(\$[0-9])\((\s*)(?!function\b|'|{)/g, "csuiDefine$1($2");
    }
    return contents;
  }
  grunt.initConfig({
    smartuiCheck: {
      all: {
        options: {
          scripts: [ "*/**/*.js", "!lib/**/*.js", "!bundles/nls/**/*.js", "../Gruntfile.js", "../pages/debug/**/*.js", "../test/*/*.js", "../test/csui/scenarios/**/*.js", "!**/test/vendor/**/*.js", "!**/test/codeceptjs/**/*.js" ],
          stylesheets: [ "**/*.css", "!**/controls/table/cells/toggledetails/impl/toggledetails.css", "!**/controls/table/impl/table.css-vars.css", "!**/controls/table/impl/table.css", "!**/controls/perspective.panel/impl/perspective.panel.css", "!**/widgets/shortcuts/impl/shortcut/impl/large.shortcut.css", "!**/widgets/shortcuts/impl/shortcut/impl/medium.shortcut.css", "!**/widgets/shortcuts/impl/shortcut/impl/small.shortcut.css", "!**/widgets/shortcuts/impl/shortcuts.css", "!**/test/vendor/**/*.css", "!**/themes/carbonfiber/smart.theme.css", "!**/themes/carbonfiber/csui.theme.css", "!**/themes/carbonfiber/init.css", "!**/lib/**/*.css" ],
          pages: [ "**/test/*.html", "**/fonts/*.html", "**/sample-index.html" ],
          configs: [ "**/*.json", "../*.json", "../pages/**/*.json", "../samples/**/*.json", "../test/*.json", "!**/test/vendor/**/*.json" ]
        }
      }
    },
    smartuiCompile: {
      all: {
        options: {
          bundles: requirejsModules,
          bundleIndexes: requirejsBundleIndexes,
          moduleDependencies: modulesWeDependOn,
          allowIndexedPrivateModules: true,
          checkExceptions: [ "helpers", "table.css" ],
          onBuildWrite: writeStamps
        }
      }
    },
    smartuiPackage: {
      all: {}
    },
    requirejsCleanOutput: {
      options: {
        processItem: function(item, helpers) {
          if (item.name === "carbonfiber") {
            helpers.deleteFullDir(item.path + "/binf/css");
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
          if (item.name === "light") {
            helpers.deleteFile(item.path + "/overrides.min.css");
            helpers.deleteFile(item.path + "/overrides.min.css.map");
            return true;
          }
        }
      }
    },
    clean: {
      debug: [ "../out-core/debug/**" ],
      release: [ "../out-core/release/**" ],
      sprite_svg: [ "themes/carbonfiber/image/generated_icons", "themes/*/svg_sprite*", "controls/svg_sprite*", "widgets/svg_sprite*" ],
      options: {
        force: true
      }
    },
    copy: {
      "binf-theme": {
        files: [ {
          cwd: "../lib/src/smart/themes/carbonfiber/binf/",
          src: [ "fonts/**" ],
          dest: "themes/carbonfiber/binf",
          expand: true,
          filter: "isFile"
        }, {
          cwd: "../lib/src/smart/themes/carbonfiber/image/",
          src: [ "**", "!favicon.ico", "!action_icons/*.*", "!icons.with.color.schema/*.*" ],
          dest: "themes/carbonfiber/image",
          expand: true,
          filter: "isFile"
        }, {
          cwd: "../lib/debug/smart/themes/carbonfiber/",
          src: [ "init.css", "theme.css" ],
          dest: "themes/carbonfiber/",
          expand: true,
          filter: "isFile",
          rename: function(dest, src) {
            var filePrefix = src.indexOf("init") === 0 ? "" : "smart.";
            return dest + src.replace(src, filePrefix + src);
          }
        } ]
      },
      "core-debug": {
        files: [ {
          cwd: "../out-debug",
          src: [ "**bundles/*", "!bundles/csui-app*", "!bundles/csui-browse*", "!bundles/csui-metadata*", "!bundles/csui-signin*", "!bundles/csui-error*", "!bundles/csui-visualisation*" ],
          dest: "../out-core/debug",
          expand: true,
          filter: "isFile"
        } ]
      },
      "core-release": {
        files: [ {
          cwd: "../out-release",
          src: [ "**bundles/*", "!bundles/csui-app*", "!bundles/csui-browse*", "!bundles/csui-metadata*", "!bundles/csui-signin*", "!bundles/csui-error*", "!bundles/csui-visualisation*" ],
          dest: "../out-core/release",
          expand: true,
          filter: "isFile"
        } ]
      },
      "froala-debug": {
        files: [ {
          cwd: "./lib",
          src: [ "**froala_editor/**/*", "!**froala_editor/index.html" ],
          dest: "../out-debug/lib/",
          expand: true
        } ]
      },
      "froala-release": {
        files: [ {
          cwd: "./lib",
          src: [ "**froala_editor/**/*", "!**froala_editor/index.html" ],
          dest: "../out-release/lib",
          expand: true
        } ]
      },
      "nucleus-lang-en": {
        files: [ {
          cwd: "../lib/languagepack_en/nuc",
          src: "**",
          dest: "../out-languagepack_en/nucleus/",
          expand: true
        } ]
      },
      "smart-lang-en": {
        files: [ {
          cwd: "../lib/languagepack_en/smart",
          src: "**",
          dest: "../out-languagepack_en/smart/",
          expand: true
        } ]
      },
      "cssvui-lang-en": {
        files: [ {
          cwd: "../lib/languagepack_en/cssvui",
          src: "**",
          dest: "../out-languagepack_en/cssvui/",
          expand: true
        } ]
      }
    },
    generateSVGs: {
      mimeTypeIconsWithColorSchema: {
        options: {
          iconNamePrefix: "csui_",
          nameMap: {
            "tree_shortcut-overlay": "colorschema_shortcut-overlay",
            tree_channel: "colorschema_mime_channel",
            tree_collection: "colorschema_mime_collection",
            tree_cs_project: "colorschema_mime_cs_project",
            tree_form: "colorschema_mime_form",
            tree_layout_template: "colorschema_mime_layout_template",
            tree_livereport: "colorschema_mime_livereport",
            tree_shortcut: "colorschema_mime_shortcut",
            tree_task_list: "colorschema_mime_task_list",
            tree_virtual_folder: "colorschema_mime_virtual_folder",
            tree_wiki: "colorschema_mime_wiki",
            tree_workflow_map: "colorschema_mime_workflow_map",
            tree_workflow_status: "colorschema_mime_workflow_status",
            tree_xml: "colorschema_mime_xml"
          }
        },
        files: [ {
          src: [ "themes/carbonfiber/image/icons.with.color.schema/*.svg" ],
          dest: "themes/carbonfiber/mimetype_colorschema_icons.js"
        } ]
      },
      mimeTypeIcons: {
        options: {
          iconNamePrefix: "csui_",
          nameMap: {
            url: "mime_url",
            custom_column: "mime_custom_column",
            shortcut: "mime_shortcut",
            category: "mime_category",
            category_nonselectable32: "mime_category_nonselectable32",
            category_volume: "mime_category_volume",
            category_volume_nonselectable32: "mime_category_volume_nonselectable32",
            collection: "mime_collection",
            title_enterprise: "mime_enterprise",
            prospector: "mime_prospector",
            perspective_assets_folder: "mime_perspective_assets_folder",
            perspective_assets_folder_nonselectable32: "mime_perspective_assets_folder_nonselectable32",
            perspective_assets_volume: "mime_perspective_assets_volume",
            perspective_assets_volume_nonselectable32: "mime_perspective_assets_volume_nonselectable32",
            virtual_folder: "mime_virtual_folder",
            assignment_workflow: "mime_assignment_workflow",
            layout_template: "mime_layout_template",
            pulse_comment: "mime_pulse_comment"
          }
        },
        files: [ {
          src: [ "themes/carbonfiber/image/csui/icons/mime_*.svg", "themes/carbonfiber/image/icons/mime_*.svg", "themes/carbonfiber/image/icons/nonselectable-overlay.svg", "themes/carbonfiber/image/icons/shortcut-overlay.svg", "themes/carbonfiber/image/icons/generation-overlay.svg", "themes/carbonfiber/image/icons/url.svg", "themes/carbonfiber/image/icons/shortcut.svg", "themes/carbonfiber/image/icons/category.svg", "themes/carbonfiber/image/icons/category_category_nonselectable32.svg", "themes/carbonfiber/image/icons/category_volume.svg", "themes/carbonfiber/image/icons/category_volume_nonselectable32.svg", "themes/carbonfiber/image/icons/collection.svg", "themes/carbonfiber/image/icons/custom_column.svg", "themes/carbonfiber/image/icons/title_enterprise.svg", "themes/carbonfiber/image/icons/prospector.svg", "themes/carbonfiber/image/icons/perspective_assets_*.svg", "themes/carbonfiber/image/icons/virtual_folder.svg", "themes/carbonfiber/image/csui/ot-icons/mime/mime_roles32.svg", "themes/carbonfiber/image/csui/ot-icons/mime/mime_rules32.svg", "themes/carbonfiber/image/icons/title_enterprise.svg", "themes/carbonfiber/image/icons/assignment_workflow.svg", "themes/carbonfiber/image/icons/layout_template.svg", "themes/carbonfiber/image/icons/pulse_comment.svg", "!themes/carbonfiber/image/icons/mime_folder.svg", "!themes/carbonfiber/image/icons/mime_document.svg", "!themes/carbonfiber/image/icons/mime_pdf.svg", "!themes/carbonfiber/image/icons/mime_image.svg", "!themes/carbonfiber/image/icons/smart_mime*.svg" ],
          dest: "themes/carbonfiber/mimetype_icons.js"
        } ]
      },
      actionIcons: {
        options: {
          iconNamePrefix: "csui_",
          extraCssClass: "csui-icon-v2-action-icon"
        },
        files: [ {
          src: [ "themes/carbonfiber/image/action_icons/*.svg", "!themes/carbonfiber/image/action_icons/smart_*.svg" ],
          dest: "themes/carbonfiber/action_icons.js"
        } ]
      }
    },
    rtlcss: {
      debug: {
        files: [ {
          expand: true,
          cwd: "../out-debug/themes/carbonfiber",
          src: [ "./init.css", "./theme.css" ],
          dest: "../out-debug/themes/carbonfiber/",
          rename: function(dest, src) {
            return dest + src.replace(".css", "-rtl.css");
          }
        }, {
          expand: true,
          cwd: "../out-debug/themes/light",
          src: "./theme.css",
          dest: "../out-debug/themes/light/",
          rename: function(dest, src) {
            return dest + src.replace(".css", "-rtl.css");
          }
        } ]
      },
      release: {
        files: [ {
          expand: true,
          cwd: "../out-release/themes/carbonfiber",
          src: [ "./init.css", "./theme.css" ],
          dest: "../out-release/themes/carbonfiber/",
          rename: function(dest, src) {
            return dest + src.replace(".css", "-rtl.css");
          }
        }, {
          expand: true,
          cwd: "../out-release/themes/light",
          src: "./theme.css",
          dest: "../out-release/themes/light/",
          rename: function(dest, src) {
            return dest + src.replace(".css", "-rtl.css");
          }
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
        }, {
          expand: true,
          cwd: "../out-release/themes/light",
          src: [ "*.css", "!*.min.css" ],
          dest: "../out-release/themes/light"
        } ]
      }
    },
    compress: {
      core_debug: {
        options: {
          archive: `../dist/core-debug.zip`,
          level: 9
        },
        files: [ {
          expand: true,
          cwd: "../out-debug",
          src: [ "../out-core/debug" ]
        } ]
      },
      core_release: {
        options: {
          archive: `../dist/core-release.zip`,
          level: 9
        },
        files: [ {
          expand: true,
          cwd: "../out-release",
          src: [ "../out-core/release" ]
        } ]
      }
    }
  });
  grunt.loadTasks("../node_modules/@smartui/grunt-support/tasks");
  grunt.loadTasks("../node_modules/grunt-contrib-clean/tasks");
  grunt.loadTasks("../node_modules/grunt-contrib-compress/tasks");
  grunt.loadTasks("../node_modules/grunt-contrib-copy/tasks");
  grunt.loadTasks("../node_modules/grunt-contrib-cssmin/tasks");
  grunt.loadTasks("../node_modules/grunt-rtlcss/tasks");
  grunt.registerTask("check", [ "smartuiCheck:all:src" ]);
  grunt.registerTask("fix", [ "smartuiCheck:all:fix" ]);
  grunt.registerTask("debug", [ "clean:debug", "copy:binf-theme", "clean:sprite_svg", "generateSVGs", "smartuiCompile:all:debug", "rtlcss:debug", "copy:core-debug", "copy:froala-debug" ]);
  grunt.registerTask("release", [ "clean:release", "smartuiCompile:all:release", "rtlcss:release", "cssmin:release", "copy:core-release", "copy:froala-release" ]);
  grunt.registerTask("package", [ "smartuiPackage", "compress:core_debug", "compress:core_release" ]);
  grunt.registerTask("default", [ "check", "debug", "release", "package" ]);
};