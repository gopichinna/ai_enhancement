define(['nuc/lib/normalize'], function(normalize) {
  let path, sourceMap, sourceMappingURL, sourceMapResolve;
  if (typeof require === 'function' && require.nodeRequire) {
    path = require.nodeRequire('path');
    try {
      sourceMap = require.nodeRequire('source-map');
      sourceMappingURL = require.nodeRequire('source-map-url');
      sourceMapResolve = require.nodeRequire('source-map-resolve');
    } catch (err) {
      sourceMap = sourceMappingURL = sourceMapResolve = undefined;
      if (!global['css-buffers:sourceMapsRequired']) {
        let { message } = err;
        message = message.split(/\r?\n/)[0];
        console.warn('Warning: CSS source maps won\'t be generated:', message);
        global['css-buffers:sourceMapsRequired'] = true;
      }
    }
  }

  const layerBuffers = {};

  function writeBundle(data, siteRoot, config, { loadFile, saveFile }) {
    var outPath = data.path.replace(/(\.js)?$/, '.css');
    const relativeOutPath = path.relative(process.cwd(), outPath);
    console.log(`Writing CSS file: ${relativeOutPath}`);

    const cssBuilders = Object.keys(layerBuffers);
    const completeLayerBuffer = cssBuilders
      .map(type => layerBuffers[type].map(entry => ({ type, ...entry })))
      .flat();
    let css, map;
    if (sourceMap) {
      const sourceMapGenerator = new sourceMap.SourceMapGenerator({
        file: outPath
      });
      let totalLineCount = 0;
      css = completeLayerBuffer
        .map(({ css, file: sourcePath }) => {
          let map;
          try {
            map = sourceMapResolve.resolveSourceMapSync(css, sourcePath, loadFile);
          } catch (error) {
            console.log('Resolving source maps for "' + sourcePath + '" failed:');
            console.log(error);
          }
          let lineCount;
          if (map) {
            map = map.map;
            css = sourceMappingURL.removeFrom(css);
            const lines = css.split('\n');
            lineCount = lines.length;
            const sourceMapConsumer = new sourceMap.SourceMapConsumer(map);
            sourceMapConsumer.eachMapping(function (mapping) {
              var newMapping = {
                generated: {
                  line: totalLineCount + mapping.generatedLine,
                  column: mapping.generatedColumn
                }
              };
              if (mapping.source != null) {
                if (mapping.originalLine != null) {
                  newMapping.source = mapping.source;
                  newMapping.original = {
                    line: mapping.originalLine,
                    column: mapping.originalColumn
                  };
                }
                if (mapping.name != null) {
                  newMapping.name = mapping.name;
                }
              }
              sourceMapGenerator.addMapping(newMapping);
            });
            sourceMapConsumer.sources.forEach(function (source) {
              var content = sourceMapConsumer.sourceContentFor(source);
              if (content) {
                sourceMapGenerator.setSourceContent(source, content);
              }
            });
          } else {
            const lines = css.split('\n');
            lineCount = lines.length;
            for (let i = 1; i <= lineCount; ++i) {
              sourceMapGenerator.addMapping({
                generated: {
                  line: totalLineCount + i,
                  column: 0
                },
                original: {
                  line: i,
                  column: 0
                },
                source: sourcePath
              });
            }
            sourceMapGenerator.setSourceContent(sourcePath, css);
          }
          totalLineCount += lineCount - 1;
          return css;
        })
        .join('');
      let map = sourceMapGenerator.toJSON();
      if (config.onBeforeWriteCssModuleBundle) {
        config.onBeforeWriteCssModuleBundle({ path: data.name, css, map });
      }
      if (config.separateCSSSourceMap) {
        map = JSON.stringify(map, null, '  ');
      } else {
        if (!css.endsWith('\n')) {
          css += '\n';
        }
        map = JSON.stringify(map);
        const encodedMap = Buffer.from(map, 'utf8').toString('base64');
        const mappingUrl = `/*# sourceMappingURL=data:application/json;charset=utf-8;base64,${encodedMap} */`;
        css += mappingUrl;
      }
    } else {
      css = completeLayerBuffer
        .map(({ module, css }) => {
          let prefix = `/* css!${module} */\n`;
          prefix = css.startsWith('\n') ? prefix : prefix + '\n';
          const suffix = css.endsWith('\n') ? '' : '\n';
          return prefix + css + suffix
        })
        .join('\n');
    }

    process.nextTick(function() {
      if (global._requirejsCssData) {
        css = global._requirejsCssData.css = css + global._requirejsCssData.css;
        delete global._requirejsCssData.usedBy.css;
        if (Object.keys(global._requirejsCssData.usedBy).length === 0) {
          delete global._requirejsCssData;
        }
      }

      // Normalize the URLs once more, because the separate CSS file can be placed
      // next to the Require.js output module; not to the outDir, which the first
      // normalization applied to single files used as a base directory.
      css = normalize(css, siteRoot, outPath);
      saveFile(outPath, css);
      if (map && config.separateCSSSourceMap) {
        saveFile(`${outPath}.map`, map);
      }
    });

    //clear all layer buffers for next layer
    for (const cssBuilder of cssBuilders) {
      const layerBuffer = layerBuffers[cssBuilder];
      layerBuffer.splice(0, layerBuffer.length);
    }
  }

  function writeModule(layerBuffer, { update, write }) {
    var css = layerBuffer
      .map(({ css }) => css)
      .join('');
    if (css) {
      write(
        "(function(c){var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})\n"
        + "('" + update(css) + "');\n"
      );
    }
  }

  return { layerBuffers, writeBundle, writeModule };
});
