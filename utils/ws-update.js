/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const chalk = require("chalk"), logger = require("./logger"), propertiesReader = require("properties-reader"), {
  readFileSync,
  writeFileSync
} = require("fs"), {
  readdirSync,
  copySync,
  outputJsonSync,
  rmSync,
  existsSync
} = require("fs-extra"), {
  join,
  relative
} = require("path"), ejs = require("ejs"), refDirRoot = process.cwd(), svAppTemplatePath = join(refDirRoot, "tools/generator-d2sv/generators/app-sv/templates/smartview"), rootPackageJsonPath = join(refDirRoot, "package.json"), rootPackageJson = require(rootPackageJsonPath);

const path = require("path");

(async () => {
  const argv = process.argv, pluginModulesStr = argv[2], pluginModules = pluginModulesStr?.split(",");
  logger.info(`Running update for ${chalk.cyan(pluginModulesStr)}`);
  if (pluginModules && pluginModules.length > 0) {
    for (let i in pluginModules) {
      const pluginModule = pluginModules[i], pluginPath = join(refDirRoot, pluginModule);
      await updateModule(pluginPath);
    }
  } else {
    throw new Error("Plugin modules are mandatory for updating the modules");
  }
  delete rootPackageJson.scripts["wsupdate"];
  outputJsonSync(rootPackageJsonPath, rootPackageJson, {
    spaces: 2
  });
  rmSync(join(refDirRoot, "utils", "ws-update.js"), {
    force: true
  });
})();

async function updateModule(pluginPath) {
  await updateSmartView(pluginPath);
}

async function updateSmartView(pluginPath) {
  const mainPath = join(pluginPath, "src", "main"), smartviewPath = join(mainPath, "smartview");
  if (!existsSync(smartviewPath)) {
    logger.info(`SmartView is not included in ${chalk.cyan(pluginPath)}`);
    return;
  }
  logger.info(`Updating SmartView for ${chalk.cyan(pluginPath)}`);
  const pluginPackageJsonPath = join(smartviewPath, "package.json"), pluginPackageJson = require(pluginPackageJsonPath), templatePackageJson = require(join(svAppTemplatePath, "package.json")), svPropertiesPath = join(mainPath, "resources", "smartview", "SmartView.properties"), svProperties = propertiesReader(svPropertiesPath, {
    writer: {
      saveSections: true
    }
  }), pluginNameSpace = svProperties.get("namespace");
  templatePackageJson.name = pluginNameSpace;
  templatePackageJson.version = pluginPackageJson.version;
  templatePackageJson.description = pluginPackageJson.description;
  templatePackageJson.private = pluginPackageJson.private;
  let updatedPackageJsonContent = ejs.render(JSON.stringify(templatePackageJson), {
    namespace: pluginNameSpace
  });
  outputJsonSync(pluginPackageJsonPath, JSON.parse(updatedPackageJsonContent), {
    spaces: 2
  });
  if (svProperties.get("d2Version") !== rootPackageJson.version) {
    svProperties.set("d2Version", rootPackageJson.version);
    await svProperties.save(svPropertiesPath);
  }
  readdirSync(smartviewPath, {
    withFileTypes: true
  }).forEach(dir => {
    if (dir.isDirectory() && dir.name === "src" || dir.name === "package.json" || dir.isSymbolicLink()) {
      return;
    }
    rmSync(join(smartviewPath, dir.name), {
      recursive: true,
      force: true
    });
  });
  let relativeWorkspacePath = relative(pluginPath, refDirRoot);
  relativeWorkspacePath = relativeWorkspacePath.replace(/\\/g, "/");
  updateTemplateFile(join(svAppTemplatePath, "namespace.setup.js"), join(smartviewPath, `${pluginNameSpace}.setup.js`), {
    relativeWorkspacePath: relativeWorkspacePath
  });
  copySync(join(svAppTemplatePath, ".csslintrc"), join(smartviewPath, ".csslintrc"), {
    overwrite: true
  });
  copySync(join(svAppTemplatePath, ".eslintrc.yml"), join(smartviewPath, ".eslintrc.yml"), {
    overwrite: true
  });
  copySync(join(svAppTemplatePath, ".eslintrc-html.yml"), join(smartviewPath, ".eslintrc-html.yml"), {
    overwrite: true
  });
  copySync(join(svAppTemplatePath, ".npmrc"), join(smartviewPath, ".npmrc"), {
    overwrite: true
  });
  copySync(join(svAppTemplatePath, "Gruntfile.js"), join(smartviewPath, "Gruntfile.js"), {
    overwrite: true
  });
  copySync(join(svAppTemplatePath, "server.conf.js"), join(smartviewPath, "server.conf.js"), {
    overwrite: true
  });
  copySync(join(svAppTemplatePath, "test", "Gruntfile.js"), join(smartviewPath, "test", "Gruntfile.js"), {
    overwrite: true
  });
  copySync(join(svAppTemplatePath, "test", "karma.conf.js"), join(smartviewPath, "test", "karma.conf.js"), {
    overwrite: true
  });
  copySync(join(svAppTemplatePath, "src", "Gruntfile.js"), join(smartviewPath, "src", "Gruntfile.js"), {
    overwrite: true
  });
  copySync(join(svAppTemplatePath, "src", "component.js"), join(smartviewPath, "src", "component.js"), {
    overwrite: true
  });
  if (existsSync(join(smartviewPath, "src", "extensions.json"))) {
    copySync(join(smartviewPath, "src", "extensions.json"), join(smartviewPath, "src", `${pluginNameSpace}-extensions.json`), {
      overwrite: true
    });
    rmSync(join(smartviewPath, "src", "extensions.json"), {
      force: true
    });
  }
  updateTemplateFile(join(svAppTemplatePath, "src", "test", "extensions.spec.js"), join(smartviewPath, "src", "test", "extensions.spec.js"), {
    namespace: pluginNameSpace
  });
  copySync(join(smartviewPath, "src", `${pluginNameSpace}-init.js`), join(smartviewPath, "src", `${pluginNameSpace}-init.js.bak`), {
    overwrite: true
  });
  updateTemplateFile(join(svAppTemplatePath, "src", "namespace-init.js"), join(smartviewPath, "src", `${pluginNameSpace}-init.js`), {
    namespace: pluginNameSpace
  });
  rmSync(join(smartviewPath, "src", "config-build.js"), {
    force: true
  });
  logger.debug(`Updated SmartView for ${chalk.cyan(pluginPath)}`);
}

function updateTemplateFile(templateFilePath, targetFilePath, templateMap) {
  const templateFileContent = readFileSync(templateFilePath, {
    encoding: "utf8"
  }), updatedFileContent = ejs.render(templateFileContent, templateMap);
  writeFileSync(targetFilePath, updatedFileContent, {
    encoding: "utf8",
    overwrite: true
  });
}