/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const Generator = require("yeoman-generator"), {
  EOL
} = require("os"), fs = require("fs-extra"), path = require("path"), {
  Parser
} = require("xml2js"), parser = new Parser(), esprima = require("esprima"), escodegen = require("escodegen"), uniqid = require("uniqid"), _ = require("./lodash-complete"), nsGenerator = require("./plugin.namesapce.generator"), beautifier = require("js-beautify"), propReader = require("properties-reader");

const pluginRelativeResourcePath = "src/main/resources", pluginRelativeSVResourcePath = "src/main/resources/smartview", pluginRelativeSrcPath = "src/main/smartview";

module.exports = class BaseModuleGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);
  }
  async initializing() {
    try {
      let pomContent = this.fs.read(this.destinationPath("pom.xml"));
      let pomJson = await parser.parseStringPromise(pomContent);
      this.pomJson = pomJson;
      let pomProperties = pomJson.project && Array.isArray(pomJson.project.properties) ? pomJson.project.properties[0] : {};
      this.d2Version = pomProperties["d2.version"] || "";
      let innerModules = pomJson.project && Array.isArray(pomJson.project.modules) ? pomJson.project.modules[0] : undefined;
      if (innerModules && Array.isArray(innerModules.module)) {
        this.pluginMap = innerModules.module.filter(m => {
          return fs.existsSync(this.destinationPath(m));
        }).map(m => {
          let svResourcePath = path.join(m, pluginRelativeSVResourcePath, "SmartView.properties"), name = path.basename(m), namespace;
          try {
            const properties = propReader(this.destinationPath(svResourcePath), "utf-8");
            if (properties && properties.get("namespace")) {
              namespace = properties.get("namespace");
            }
          } catch (e) {}
          if (!namespace) {
            try {
              let pluginNs = this.fs.read(this.destinationPath(path.join(m, pluginRelativeResourcePath, "D2Plugin.properties")));
              if (_.isString(pluginNs) && !_.isEmpty(pluginNs)) {
                pluginNs = pluginNs.split(EOL)[0].trim().toLowerCase();
                if (this.fs.exists(this.destinationPath(path.join(m, pluginRelativeResourcePath, `${pluginNs}-version.properties`)))) {
                  namespace = pluginNs;
                }
              }
            } catch (e) {}
          }
          if (!namespace) {
            namespace = nsGenerator.getPluginNSFromArtifactId(name);
          }
          return {
            name: name,
            namespace: namespace,
            module: m,
            pluginPath: this.destinationPath(m),
            srcPath: path.join(m, pluginRelativeSrcPath, "src"),
            svPath: path.join(m, pluginRelativeSrcPath),
            resourcePath: path.join(m, pluginRelativeSVResourcePath)
          };
        }).reduce((finalObject, m) => {
          finalObject[m.name] = m;
          return finalObject;
        }, {});
      } else {
        this.pluginMap = {};
      }
    } catch (e) {
      this.pluginMap = {};
    }
    return Promise.all(Object.keys(this.pluginMap).map(pluginName => {
      return new Promise((resolve, reject) => {
        let plugin = this.pluginMap[pluginName];
        let pluginPOMFile = path.join(plugin.pluginPath, "pom.xml");
        let pluginPOMContent = this.fs.read(pluginPOMFile);
        parser.parseStringPromise(pluginPOMContent).then(pluginPOMJson => {
          if (pluginPOMJson && pluginPOMJson.project) {
            plugin["desc"] = pluginPOMJson.project.description || pluginPOMJson.project.name || pluginName;
          }
          resolve();
        }).catch(reject);
      });
    }));
  }
  _validatePluginSelection(plugin) {
    if (this.pluginMap[plugin]) {
      const svResourcePath = this.destinationPath(path.join(this.pluginMap[plugin].resourcePath, "SmartView.properties"));
      return this.fs.exists(svResourcePath);
    }
    return false;
  }
  _validateAlphaNumericNonLeadingNumberValue(value) {
    if (/^[a-zA-Z]+[\w]*$/.test(value)) {
      return true;
    }
    return "Only alphanumeric values with non-digit leading character are allowed";
  }
  _validateCssClassName(value) {
    if (/^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/.test(value)) {
      return true;
    }
    return "Not a valid CSS class name";
  }
  _validateFileNamingConvention(value) {
    if (/^[a-z]+(\.?[a-z0-9_]+)*$/.test(value)) {
      return true;
    }
    return "Name can be lowercase alphanumeric with '.' & '_' at any but non-leading position";
  }
  _deduceName(type, prefix = "", suffix = "") {
    if (_.isString(type) && !_.isEmpty(type)) {
      type = `${_.capitalize(prefix)}${_.capitalize(type)}${_.capitalize(suffix)}`;
      return _.underscored(type).replace(/^[_]+/, "").replace(/_/g, ".");
    }
  }
  _getDestFile(pluginName, srcRelativeFilePath, fileExt = ".js") {
    let filePath = this.destinationPath(path.join(this.pluginMap[pluginName].srcPath, srcRelativeFilePath));
    if ([ ".js", ".json", ".hbs", ".css" ].some(ext => filePath.endsWith(ext))) {
      return filePath;
    }
    return `${filePath}${fileExt}`;
  }
  _walkAllFilesInternal(rootPath, dirPath, callback) {
    if (fs.existsSync(dirPath)) {
      let files = fs.readdirSync(dirPath);
      files.forEach(file => {
        let filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
          this._walkAllFilesInternal(rootPath, filePath, callback);
        } else {
          _.isFunction(callback) && callback({
            fileName: file,
            filePath: filePath,
            relativeDirPath: dirPath.substring(rootPath.length).replace(/^\\/, "").replace(/^\//, "")
          });
        }
      });
    }
  }
  _walkAllFiles(dirPath, callback) {
    this._walkAllFilesInternal(dirPath, dirPath, callback);
  }
  _addToExtensionJson(pluginName, namespace, targetExtPath, srcExtPath) {
    const fileName = this._getDestFile(pluginName, `${namespace}-extensions.json`);
    const content = this.fs.read(fileName);
    const extensions = JSON.parse(content);
    let extension = extensions[targetExtPath];
    if (!extension) {
      extension = extensions[targetExtPath] = {};
    }
    let extDefinition = extension.extensions;
    if (!extDefinition) {
      extDefinition = extension.extensions = {};
    }
    let extensionList = extDefinition[namespace];
    if (!extensionList) {
      extensionList = extDefinition[namespace] = [];
    }
    const extPath = srcExtPath, extensionExists = extensionList.find(name => extPath === name);
    if (!extensionExists) {
      extensionList.push(extPath);
      extensionList = extensionList.sort();
      let output = JSON.stringify(extensions, undefined, 2);
      this.fs.write(fileName, output);
    }
  }
  _readJSCode(fileName, keepComments = true) {
    if (fileName && this.fs.exists(fileName)) {
      const content = this.fs.read(fileName);
      return this._readJSCodeFromString(content, keepComments);
    }
  }
  _readJSCodeFromString(content, keepComments = true) {
    if (content) {
      let ast = esprima.parse(content, {
        tokens: true,
        range: true,
        comment: keepComments
      });
      if (keepComments) {
        ast = escodegen.attachComments(ast, ast.comments, ast.tokens);
      }
      return ast;
    }
  }
  _writeJSCode(fileName, ast, keepComments = true, srcContent) {
    let options = {
      comment: keepComments,
      format: {
        indent: {
          style: "  "
        },
        preserveBlankLines: true
      }
    };
    if (srcContent) {
      options.sourceCode = srcContent;
    }
    let output = escodegen.generate(ast, options);
    this.fs.write(fileName, beautifier.js(output));
  }
  _traverseCode(ast, visitor) {
    if (!ast) {
      return;
    }
    if (visitor.call(null, ast) === false) {
      return false;
    }
    for (var i = 0, keys = Object.keys(ast), count = keys.length; i < count; ++i) {
      var child = ast[keys[i]];
      if (typeof child === "object" && child !== null) {
        if (this._traverseCode(child, visitor) === false) {
          return false;
        }
      }
    }
  }
  _addRequirejsDependenciesToModule(pluginName, targetModulePath, dependencies = []) {
    if (targetModulePath && dependencies.length) {
      const fileName = this._getDestFile(pluginName, targetModulePath);
      const code = this._readJSCode(fileName);
      if (code) {
        let atLeastOneAdded = false;
        this._traverseCode(code, node => {
          if (node && node.type === "CallExpression") {
            let callee = node.callee;
            if (callee && callee.type === "Identifier" && callee.name === "define" && node.arguments.length >= 1 && node.arguments[0].type === "ArrayExpression") {
              let hasFactory = node.arguments.length >= 2 && node.arguments[1].type === "FunctionExpression";
              let depDecl = node.arguments[0].elements || (node.arguments[0].elements = []);
              let depRecv = hasFactory ? node.arguments[1].params || (node.arguments[1].params = []) : [];
              for (const dep of dependencies.filter(d => _.isString(d.path) && !_.isEmpty(d.path))) {
                let depIndex = depDecl.findIndex(d => d.type === "Literal" && d.value === dep.path);
                if (depIndex === -1) {
                  atLeastOneAdded |= true;
                  depIndex = depDecl.length;
                  depDecl.push({
                    type: "Literal",
                    raw: `'${dep.path}'`,
                    value: `${dep.path}`
                  });
                }
                if (hasFactory && _.isString(dep.symbol) && !_.isEmpty(dep.symbol)) {
                  atLeastOneAdded |= true;
                  if (depRecv.length > depIndex) {
                    depRecv[depIndex] = {
                      type: "Identifier",
                      name: `${dep.symbol}`
                    };
                  } else {
                    while (depRecv.length < depIndex) {
                      var baseModName = path.basename(depDecl[depRecv.length].value);
                      var modName = baseModName.replace(/\./g, "_");
                      depRecv.push({
                        type: "Identifier",
                        name: uniqid.time(`${_.camelize(modName)}_`)
                      });
                    }
                    depRecv.push({
                      type: "Identifier",
                      name: `${dep.symbol}`
                    });
                  }
                }
              }
              return false;
            }
          }
        });
        if (atLeastOneAdded) {
          this._writeJSCode(fileName, code);
        }
      }
    }
  }
};