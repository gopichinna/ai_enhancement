/**
 * @preserve
 * require-less 0.1.5
 * Copyright (C) 2013 Guy Bedford
 * Distributed under MIT license
 * https://github.com/guybedford/require-less
 */

define(function() {

  var lessAPI = {};

//>>excludeStart('excludeRequireLess', pragmas.excludeRequireLess)
  lessAPI.pluginBuilder = 'nuc/lib/less-builder';

  if (typeof window == 'undefined') {
    lessAPI.load = function(n, r, load) { load(); };
    return lessAPI;
  }
//>>excludeEnd('excludeRequireLess')

  lessAPI.normalize = function(name, normalize) {
    if (name.substr(name.length - 5, 5) == '.less')
      name = name.substr(0, name.length - 5);

    name = normalize(name);

    return name;
  };

//>>excludeStart('excludeRequireLess', pragmas.excludeRequireLess)
  var head = document.getElementsByTagName('head')[0];
  var linkWithThemeOverridesFlag = head.querySelector('link[data-csui-theme-overrides]') ||
                                   head.querySelector('style[data-csui-theme-overrides]');

  var base = document.getElementsByTagName('base');
  base = base && base[0] && base[0] && base[0].href;
  var pagePath = (base || window.location.href.split('#')[0].split('?')[0]).split('/');
  pagePath[pagePath.length - 1] = '';
  pagePath = pagePath.join('/');

  var styleCnt = 0;
  var curStyle;

  function injectStyle(css, module) {
    if (styleCnt < 31) {
      curStyle = document.createElement('style');
      curStyle.setAttribute('data-nuc-required', 'true');
      curStyle.setAttribute('data-csui-required', 'true');
      curStyle.setAttribute('data-requirecontext', '_');
      curStyle.setAttribute('data-requiremodule', module);
      if (linkWithThemeOverridesFlag) {
        head.insertBefore(curStyle, linkWithThemeOverridesFlag);
      } else {
        head.appendChild(curStyle);
      }
      styleCnt++;
    }
    if (curStyle.styleSheet)
      curStyle.styleSheet.cssText += css;
    else
      curStyle.appendChild(document.createTextNode(css));
  }

  function injectLink(css, module) {
    const link = document.createElement('link');
    link.setAttribute('data-nuc-required', 'true');
    link.setAttribute('data-csui-required', 'true');
    link.setAttribute('data-requirecontext', '_');
    link.setAttribute('data-requiremodule', module);
    link.setAttribute('type', 'text/css');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', 'data:text/css;base64,' + btoa(css));
    if (linkWithThemeOverridesFlag) {
      head.insertBefore(link, linkWithThemeOverridesFlag);
    } else {
      head.appendChild(link);
    }
  }

  let renderer;
  let cssGetter;
  let normalize;

  lessAPI.load = function(lessId, req, load, config) {
    if (!renderer) {
      window.less = Object.assign({
        env: 'development',
        logLevel: 4,
        injectLink: true,
        ...config.less,
        sourceMap: {
          sourceMapFileInline: true,
          outputSourceFiles: true,
          ...config.less?.sourceMap
        }
      });

      req(['nuc/lib/lessc', 'nuc/lib/normalize'], function(lessc, normalizeArg) {
        //make it compatible with v1 and v2
        const generation = (lessc.version || [1])[0];
        if (generation === 1) {
          //v1, use parser and toCSS
          const parser = new lessc.Parser(window.less);
          renderer = function (input, cb) {
            parser.parse.call(parser, input, cb, window.less);
          };
          cssGetter = function (tree) {
            return tree.toCSS(config.less);
          };
        } else if (generation >= 2) {
          //v2 or newer, use render and output
          renderer = function (input, cb) {
            lessc.render(input, window.less, cb);
          };
          cssGetter = function (output) {
            return output.css;
          };
        } else {
          throw new Error(`Unrecognised less version: ${lessc.version}`);
        }
        normalize = normalizeArg;
        lessAPI.inject = window.less.injectLink ? injectLink : injectStyle;
        renderModule();
      });
    } else {
      renderModule();
    }

    function renderModule() {
      let fileUrl = req.toUrl(lessId + '.less');
      fileUrl = normalize.absoluteURI(fileUrl, pagePath);
      renderer(`@import (multiple) "${fileUrl}";`, function(err, output) {
        if (err) {
          console.log(err + ' at ' + fileUrl + ', line ' + err.line);
          return load.error(err);
        }
        var css = cssGetter(output);
        lessAPI.inject(normalize(css, fileUrl, pagePath), lessId);
        load();
      }, window.less);
    }
  };

//>>excludeEnd('excludeRequireLess')
  return lessAPI;
});
