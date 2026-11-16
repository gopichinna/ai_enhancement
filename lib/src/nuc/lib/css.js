/**!
 * Require-CSS RequireJS css! loader plugin 0.1.10+ (Oct 31, 2017 commit)
 * Guy Bedford 2014
 * MIT
 * https://github.com/guybedford/require-css
 */

/*
 *
 * Usage:
 *  require(['css!./mycssFile']);
 *
 * Tested and working in (up to latest versions as of March 2013):
 * Android
 * iOS 6
 * IE 6 - 10
 * Chrome 3 - 26
 * Firefox 3.5 - 19
 * Opera 10 - 12
 * 
 * browserling.com used for virtual testing environment
 *
 * Credit to B Cavalier & J Hann for the IE 6 - 9 method,
 * refined with help from Martin Cermak
 * 
 * Sources that helped along the way:
 * - https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent
 * - http://www.phpied.com/when-is-a-stylesheet-really-loaded/
 * - https://github.com/cujojs/curl/blob/master/src/curl/plugin/css.js
 *
 */

define(['i18n'], function(i18n) {
//>>excludeStart('excludeRequireCss', pragmas.excludeRequireCss)
  if (typeof window == 'undefined')
    return { load: function(n, r, load){ load() } };

  var head = document.getElementsByTagName('head')[0];
  var linkWithCustomThemeFlag = head.querySelector('link[data-csui-use-custom-theme]');
  var linkWithThemeOverridesFlag = head.querySelector('link[data-csui-theme-overrides]') ||
                                   head.querySelector('style[data-csui-theme-overrides]');

  if (linkWithCustomThemeFlag) {
    console.warn('The attribute "data-csui-use-custom-theme" has been deprecated.  ' +
                 'Instead of creating a theme for all modules in single directory, ' +
                 ' use styling overrides with the attribute "data-csui-theme-overrides".');
  }

//>>excludeEnd('excludeRequireCss')
  //main api object
  var cssAPI = {};

//>>excludeStart('excludeRequireCss', pragmas.excludeRequireCss)
  cssAPI.pluginBuilder = 'nuc/lib/css-builder';

  // <style> @import load method
  var curStyle, curSheet;
  var createStyle = function () {
    curStyle = document.createElement('style');
    curStyle.setAttribute('data-csui-required', 'true');
    if (linkWithThemeOverridesFlag) {
      head.insertBefore(curStyle, linkWithThemeOverridesFlag);
    } else {
      head.appendChild(curStyle);
    }
    curSheet = curStyle.styleSheet || curStyle.sheet;
  }
  var ieCnt = 0;
  var ieLoads = [];
  var ieCurCallback;
  
  var createIeLoad = function(url) {
    curSheet.addImport(url);
    curStyle.onload = function(){ processIeLoad() };
    
    ieCnt++;
    if (ieCnt == 31) {
      createStyle();
      ieCnt = 0;
    }
  }
  var processIeLoad = function() {
    ieCurCallback();
 
    var nextLoad = ieLoads.shift();
 
    if (!nextLoad) {
      ieCurCallback = null;
      return;
    }
 
    ieCurCallback = nextLoad[1];
    createIeLoad(nextLoad[0]);
  }

  // <link> load method
  var linkLoad = function(url, callback) {
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.setAttribute('data-csui-required', 'true');
    link.addEventListener('load', event => {
      if (event.type === 'error') callback(event);
      // for style dimensions queries, a short delay can still be necessary
      else setTimeout(() => callback(event), 7);
    });
    link.addEventListener('error', event => {
      callback(event);
    });
    link.href = url;
    if (linkWithThemeOverridesFlag) {
      head.insertBefore(link, linkWithThemeOverridesFlag);
    } else {
      head.appendChild(link);
    }
  }

//>>excludeEnd('excludeRequireCss')
  cssAPI.normalize = function(name, normalize) {
    if (name.substr(name.length - 4, 4) == '.css')
      name = name.substr(0, name.length - 4);

    return normalize(name);
  }

//>>excludeStart('excludeRequireCss', pragmas.excludeRequireCss)
  cssAPI.load = function (cssId, req, load, _config) {
    var cssUrl = req.toUrl(cssId + '.css');
    // Do not bundle excluded dependencies.
    if (cssUrl.startsWith('empty:')) {
      return load();
    }
    linkLoad(cssUrl, load);
  }

  // Enable loading separate stylesheets for module bundles:
  //   // Append this to the module bundle built by r.js
  //   require(['require', 'css'], function (require, css) {
  //     css.styleLoad(require, '<module bundle name built by r.js>');
  //   });
  cssAPI.styleLoad = function (require, moduleName, separateRTLCSS) {
    const cssFilePostfix = i18n.settings.rtl && separateRTLCSS !== false ? '-rtl.css' : '.css';
    const styleSheetUrl = getStylesheetUrl(require, moduleName, cssFilePostfix);

    return new Promise((resolve, reject) => {
      linkLoad(styleSheetUrl, event => {
        // If the RTL stylesheet could not be found and it wasn't enabled explicitly,
        // try loading the default one. It won;t work well, but better than not working
        // at all, until the team will have fixed it.
        if (event.type === 'error') {
          if (i18n.settings.rtl && separateRTLCSS == null) {
            const styleSheetUrl = getStylesheetUrl(require, moduleName, '.css');
            linkLoad(styleSheetUrl, ltrEvent => {
              event.defaultStylesheet = ltrEvent;
              reject(event);
            });
          } else {
            reject(event);
          }
        } else {
          resolve(event);
        }
      });
    });
  };

  function getStylesheetUrl(require, moduleName, cssFilePostfix) {
    const moduleUrl = require.toUrl(moduleName);
    const urlQueryIndex = moduleUrl.indexOf('?');

    let styleSheetUrl;
    // TODO: Remove support for data-csui-theme-overrides as soon as we decide.
    if (linkWithCustomThemeFlag) {
      styleSheetUrl = linkWithCustomThemeFlag.getAttribute('href');
      var slashIndex = styleSheetUrl.lastIndexOf('/');
      styleSheetUrl = 
        (slashIndex < 0 ? '' : styleSheetUrl.substring(0, slashIndex + 1)) +
        moduleName + '.css';
      if (urlQueryIndex >= 0) {
        styleSheetUrl += moduleUrl.substring(urlQueryIndex);
      }
    } else {
      // Trim URL query which was added by require.toUrl from urlArgs to
      // bust browser cache and add it after the stylesheet extension
      styleSheetUrl = urlQueryIndex < 0
        ? moduleUrl + cssFilePostfix
        : moduleUrl.substring(0, urlQueryIndex) + cssFilePostfix +
          moduleUrl.substring(urlQueryIndex);
    }

    return styleSheetUrl;
  }

//>>excludeEnd('excludeRequireCss')
  return cssAPI;
});
