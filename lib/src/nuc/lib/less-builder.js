// See the license comment in less.js

define(['require', 'nuc/lib/normalize', 'nuc/lib/css-buffers'], function(req, normalize, cssBuffers) {
  var lessAPI = {};

  var isWindows = !!process.platform.match(/^win/);
  var normalizeWinPath = function(path) {
    return isWindows ? path.replace(/\\/g, '/') : path;
  };

  var baseParts = normalizeWinPath(req.toUrl('base_url')).split('/');
  baseParts[baseParts.length - 1] = '';
  var baseUrl = baseParts.join('/');

  function compress(css) {
    var csso, csslen;
    if (config.optimizeCss == 'none' || config.compressCSS === false) {
      return css;
    }
    if (typeof process !== "undefined" && process.versions && !!process.versions.node && require.nodeRequire) {
      try {
        csso = require.nodeRequire('csso');
      }
      catch(e) {
        console.log('Compression module not installed. Use "npm install csso -g" to enable.');
        return css;
      }
      try {
        csslen = css.length;
        if (typeof csso.minify === 'function') {
          css = csso.minify(css).css;
        } else {
          css = csso.justDoIt(css);
        }
        console.log('Compressed CSS output to ' + Math.round(css.length / csslen * 100) + '%.');
        return css;
      }
      catch(e) {
        console.log('Unable to compress css.\n' + e);
        return css;
      }

    }
    console.log('Compression not supported outside of nodejs environments.');
    return css;
  }

  function loadFile(path) {
    if (typeof process !== "undefined" && process.versions && !!process.versions.node && require.nodeRequire) {
      var fs = require.nodeRequire('fs');
      var file = fs.readFileSync(path, 'utf8');
      if (file.startsWith('\uFEFF'))
        return file.substring(1);
      return file;
    }
    else {
      var file = new java.io.File(path),
        lineSeparator = java.lang.System.getProperty("line.separator"),
        input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), 'utf-8')),
        stringBuffer, line;
      try {
        stringBuffer = new java.lang.StringBuffer();
        line = input.readLine();
        if (line && line.length() && line.charAt(0) === 0xfeff)
          line = line.substring(1);
        stringBuffer.append(line);
        while ((line = input.readLine()) !== null) {
          stringBuffer.append(lineSeparator).append(line);
        }
        return String(stringBuffer.toString());
      }
      finally {
        input.close();
      }
    }
  }

  function saveFile(path, data) {
    if (typeof process !== "undefined" && process.versions && !!process.versions.node && require.nodeRequire) {
      var fs = require.nodeRequire('fs');
      fs.writeFileSync(path, data, 'utf8');
    }
    else {
      var content = new java.lang.String(data);
      var output = new java.io.BufferedWriter(new java.io.OutputStreamWriter(new java.io.FileOutputStream(path), 'utf-8'));

      try {
        output.write(content, 0, content.length());
        output.flush();
      }
      finally {
        output.close();
      }
    }
  }

  function escape(content) {
    return content.replace(/(["'\\])/g, '\\$1')
      .replace(/[\f]/g, "\\f")
      .replace(/[\b]/g, "\\b")
      .replace(/[\n]/g, "\\n")
      .replace(/[\t]/g, "\\t")
      .replace(/[\r]/g, "\\r");
  }

  var config;
  var siteRoot;

  var less = require.nodeRequire('less');
  var path = require.nodeRequire('path');

  var layerBuffer = [];
  var lessBuffer = {};
  cssBuffers.layerBuffers.less = layerBuffer;

  lessAPI.normalize = function(name, normalize) {
    if (name.substr(name.length - 5, 5) == '.less')
      name = name.substr(0, name.length - 5);
    return normalize(name);
  };

  var absUrlRegEx = /^([^\:\/]+:\/)?\//;

  lessAPI.load = function(name, req, load, _config) {
    //store config
    config = config || _config;

    if (!siteRoot) {
      siteRoot = path.resolve(
        config.dir || path.dirname(
          typeof config.out === 'string' ? config.out : ''
        ),
        config.siteRoot || '.'
      ) + '/';
      siteRoot = normalizeWinPath(siteRoot);
    }

    if (name.match(absUrlRegEx))
      return load();

    var fileUrl = normalizeWinPath(req.toUrl(name + '.less'));
    // Do not bundle excluded dependencies.
    if (fileUrl.indexOf('empty:') === 0) {
      return load();
    }
    if (isWindows)
      fileUrl = fileUrl.replace(/\\/g, '/');

    // rebase to the output directory if based on the source directory;
    // baseUrl points always to the output directory, fileUrl only if
    // it is not prefixed by a computed path (relative too)
    var fileSiteUrl = fileUrl;
    if (fileSiteUrl.indexOf(baseUrl) < 0) {
      var appRoot = req.toUrl(config.appDir);
      if (isWindows)
        appRoot = appRoot.replace(/\\/g, '/');
      if (fileSiteUrl.indexOf(appRoot) == 0)
        fileSiteUrl = siteRoot + fileSiteUrl.substring(appRoot.length);
    }

    //add to the buffer
    var cfg = Object.assign({
      paths: [baseUrl].concat(..._config.less?.paths || []),
      filename: fileUrl,
      async: false,
      syncImport: true,
      logLevel: 4,
      ..._config.less,
      sourceMap: {
        sourceMapFileInline: false,
        outputSourceFiles: true,
        ..._config.less?.sourceMap
      }
    });

    //make it compatible with v1 and v2
    var generation = less.version[0];
    var renderer;
    var cssGetter;
    if (generation === 1) {
      //v1, use parser and toCSS
      var parser = new less.Parser(cfg);
      renderer = function (input, cb) {
        parser.parse.call(parser, input, cb, cfg);
      };
      cssGetter = function (tree) {
        return tree.toCSS(config.less);
      };
    } else if (generation >= 2) {
      //v2 or newer, use render and output
      renderer = function (input, cb) {
        less.render(input, cfg, cb);
      };
      cssGetter = function (output) {
        return output.css;
      };
    }

    const relativeUrl = path.relative(baseUrl, fileUrl);
    renderer(`@import (multiple) "${relativeUrl}";`, function (err, output) {
      if (err) {
        let filePath = relativeUrl;
        if (/..(?:\/|\\)src(?:\/|\\)/.test(filePath)) {
          filePath = filePath.slice(3);
        }
        const message = err.toString();
        if (err.type == 'Syntax' && err.column === 0 && err.line === 1 &&
            err.index === 0 && message.includes(relativeUrl)) {
          console.error(`Error: File ${filePath} (module less!${name}) not found.`);
        } else {
          console.error(err + ` at ${filePath}, line ${err.line}`);
        }
        return load.error(err);
      }
      var css = cssGetter(output);
      // normalize all imports relative to the siteRoot, itself relative to the output file / output dir
      lessBuffer[name] = normalize(css, fileUrl, siteRoot);
      load();
    });
  };

  lessAPI.write = function(pluginName, moduleName, write) {
    //external URLS don't get added (just like JS requires)
    if (moduleName.match(absUrlRegEx))
      return;

    const fileUrl = req.toUrl(moduleName + '.less');
    // Do not bundle excluded dependencies.
    if (fileUrl.indexOf('empty:') === 0) {
      return;
    }

    const relativeUrl = path.relative(baseUrl, fileUrl);
    layerBuffer.push({
      module: moduleName,
      file: relativeUrl,
      css: lessBuffer[moduleName]
    });

    //use global variable to combine plugin results with results of require-css plugin
    if (!global._requirejsCssData) {
      global._requirejsCssData = {
        usedBy: {less: true},
        css: ''
      };
    } else {
      global._requirejsCssData.usedBy.less = true;
    }

    write.asModule(pluginName + '!' + moduleName, 'define(function(){})');
  };

  lessAPI.onLayerEnd = function(write, data) {
    if (config.separateCSS) {
      if (layerBuffer.length && !cssBuffers.layerBuffers.css?.length) {
        cssBuffers.writeBundle(data, siteRoot, config, { loadFile, saveFile });
      }
    } else {
      cssBuffers.writeModule(layerBuffer, {
        update(css) {
          return escape(compress(css));
        },
        write
      });
    }
    //clear layer buffer for next layer
    layerBuffer = [];
  };

  return lessAPI;
});
