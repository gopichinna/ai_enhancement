/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/jquery", "csui/lib/underscore", "smart/themes/theming", "i18n", "json!csui/utils/froala/localization.mappings.json", "csui/lib/froala_editor/js/plugins/custcsuiImage", "csui/lib/froala_editor/js/plugins/cslink", "csui/lib/froala_editor/js/plugins/sourcecode", "csui/lib/froala_editor/js/plugins/floatingspace", "csui/lib/froala_editor/js/plugins/video" ], function(require, $, _, theming, i18n, LocalizationMappings) {
  "use strict";
  const _froalaKey = "PYC4mA3B12C11A8E7D6D3eMRPYa1c1REe1BGQOQIc1CDBREJImD6F5F4D4E1B9A5C3F5E4==";
  let bootstrapFroalaEditor = function(selector, options) {
    let froalaDefaultConfig = {
      key: _froalaKey,
      attribution: false,
      toolbarSticky: false,
      theme: theming.getTheme() === "dark" ? "dark" : "royal",
      toolbarButtons: [ "bold", "italic", "underline", "strikeThrough", "subscript", "superscript", "fontSize", "textColor", "backgroundColor", "inlineClass", "inlineStyle", "clearFormatting", "alignLeft", "alignCenter", "alignRight", "alignJustify", "formatOL", "formatUL", "paragraphFormat", "paragraphStyle", "lineHeight", "outdent", "indent", "quote", "trackChanges", "markdown", "insertLink", "cslink", "insertImage", "insertTable", "fontAwesome", "specialCharacters", "undo", "redo", "customText", "spellChecker", "codeCustomView" ],
      imageInsertButtons: [ "imageUpload" ],
      imageAllowedTypes: [ "jpeg", "jpg", "png", "gif" ],
      imageResize: true,
      imageEditButtons: [ "imageReplace", "imageAlign", "imageRemove", "|", "imageLink", "linkEdit", "linkRemove", "-", "imageDisplay", "imageStyle", "imageAlt", "imageSize" ],
      imageDefaultAlign: "left",
      scrollableContainer: "body",
      pluginsEnabled: [ "align", "codeBeautifier", "colors", "entities", "file", "fontAwesome", "fontFamily", "fontSize", "resize", "inlineStyle", "link", "lists", "paragraphFormat", "paragraphStyle", "quote", "save", "specialCharacters", "table", "tableDragStart", "wordPaste", "spellChecker", "customAttachmentsPlugin", "customFloatingspace" ],
      saveInterval: 6e4,
      linkInsertButtons: [ "linkBack" ],
      linkEditButtons: [ "linkOpen", "linkEdit", "linkRemove" ],
      autofocus: true,
      useClasses: false,
      zIndex: 1069,
      direction: i18n.settings.rtl ? "rtl" : "auto",
      fontSize: [ "8", "9", "10", "11", "12", "14", "16", "18", "24", "30", "36", "48", "60", "72", "96" ],
      fontSizeSelection: true,
      fontSizeDefaultSelection: "16",
      dontConvertExternalCss: true,
      htmlRemoveTags: [ "script" ]
    };
    options.customHtmlGet = function(keep_markers, keep_classes) {
      const editor = this;
      if (!editor.$wp) {
        return editor.$oel.clone().removeClass("fr-view").removeAttr("contenteditable").get(0).outerHTML;
      }
      var html = "";
      editor.events.trigger("html.beforeGet");
      var updated_elms = [];
      var elms_info = {};
      var i;
      var j;
      var elems_specs = [];
      editor.html.syncInputs();
      if (!editor.opts.useClasses && !keep_classes) {
        var ignoreRegEx = new RegExp("^".concat(editor.opts.htmlIgnoreCSSProperties.join("$|^"), "$"), "gi");
        for (i = 0; i < editor.doc.styleSheets.length; i++) {
          if (editor.opts.dontConvertExternalCss) {
            const froalaInternalCssFiles = /lib\/froala_editor\/css\/.*\.css/;
            const href = editor.doc.styleSheets[i]?.href;
            if (!(href && froalaInternalCssFiles.test(href))) {
              continue;
            }
          }
          var rules = void 0;
          var head_style = 0;
          try {
            rules = editor.doc.styleSheets[i].cssRules;
            if (editor.doc.styleSheets[i].ownerNode && editor.doc.styleSheets[i].ownerNode.nodeType === "STYLE") {
              head_style = 1;
            }
          } catch (ex) {}
          function _specifity(selector) {
            var idRegex = /(#[^\s+>~.[:]+)/g;
            var attributeRegex = /(\[[^]]+\])/g;
            var classRegex = /(\.[^\s+>~.[:]+)/g;
            var pseudoElementRegex = /(::[^\s+>~.[:]+|:first-line|:first-letter|:before|:after)/gi;
            var pseudoClassWithBracketsRegex = /(:[\w-]+\([^)]*\))/gi;
            var pseudoClassRegex = /(:[^\s+>~.[:]+)/g;
            var elementRegex = /([^\s+>~.[:]+)/g;
            (function() {
              var regex = /:not\(([^)]*)\)/g;
              if (regex.test(selector)) {
                selector = selector.replace(regex, "     $1 ");
              }
            })();
            var s = (selector.match(idRegex) || []).length * 100 + (selector.match(attributeRegex) || []).length * 10 + (selector.match(classRegex) || []).length * 10 + (selector.match(pseudoClassWithBracketsRegex) || []).length * 10 + (selector.match(pseudoClassRegex) || []).length * 10 + (selector.match(pseudoElementRegex) || []).length;
            selector = selector.replace(/[*\s+>~]/g, " ");
            selector = selector.replace(/[#.]/g, " ");
            s += (selector.match(elementRegex) || []).length;
            return s;
          }
          if (rules) {
            for (var idx = 0, len = rules.length; idx < len; idx++) {
              if (rules[idx].selectorText) {
                if (rules[idx].style.cssText.length > 0) {
                  var selector = rules[idx].selectorText.replace(/body \s tbody \.fr-view /g, "").replace(/::/g, ":");
                  var elms = void 0;
                  try {
                    elms = editor.el.querySelectorAll(selector);
                  } catch (ex) {
                    elms = [];
                  }
                  for (j = 0; j < elms.length; j++) {
                    if (!elms[j].getAttribute("fr-original-style") && elms[j].getAttribute("style")) {
                      elms[j].setAttribute("fr-original-style", elms[j].getAttribute("style"));
                      updated_elms.push(elms[j]);
                    } else if (!elms[j].getAttribute("fr-original-style")) {
                      elms[j].setAttribute("fr-original-style", "");
                      updated_elms.push(elms[j]);
                    }
                    if (!elms_info[elms[j]]) {
                      elms_info[elms[j]] = {};
                    }
                    var spec = head_style * 1e3 + _specifity(rules[idx].selectorText);
                    var css_text = rules[idx].style.cssText.split(";");
                    for (var k = 0; k < css_text.length; k++) {
                      var rule = css_text[k].trim().split(":")[0];
                      if (!rule) {
                        continue;
                      }
                      if (rule.match(ignoreRegEx)) {
                        continue;
                      }
                      if (!elms_info[elms[j]][rule] || elms_info[elms[j]][rule] && elms[j].getAttribute("fr-original-style") == "") {
                        elms_info[elms[j]][rule] = 0;
                        if ((elms[j].getAttribute("fr-original-style") || "").indexOf("".concat(rule, ":")) >= 0) {
                          elms_info[elms[j]][rule] = 1e4;
                        }
                      }
                      if (spec >= elms_info[elms[j]][rule]) {
                        elms_info[elms[j]][rule] = spec;
                        if (css_text[k].trim().length) {
                          var info = css_text[k].trim().split(":");
                          info.splice(0, 1);
                          var cssVal = info.join(":").trim();
                          if (cssVal.indexOf("!important") > -1) {
                            spec = spec + 1;
                          }
                          elems_specs.push([ elms[j], rule.trim(), cssVal, spec ]);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        function _sortElementsBySpec(a, b) {
          return a[3] - b[3];
        }
        elems_specs.sort(_sortElementsBySpec);
        for (i = 0; i < elems_specs.length; i++) {
          var specs_elem = elems_specs[i];
          specs_elem[0].style[specs_elem[1]] = specs_elem[2].replace(/!important/, "");
        }
        for (i = 0; i < updated_elms.length; i++) {
          if (updated_elms[i].getAttribute("class")) {
            updated_elms[i].setAttribute("fr-original-class", updated_elms[i].getAttribute("class"));
            updated_elms[i].removeAttribute("class");
          }
          if ((updated_elms[i].getAttribute("fr-original-style") || "").trim().length > 0) {
            var original_rules = updated_elms[i].getAttribute("fr-original-style").split(";");
            for (j = 0; j < original_rules.length; j++) {
              if (original_rules[j].indexOf(":") > 0) {
                var splits = original_rules[j].split(":");
                var original_rule = splits[0];
                splits.splice(0, 1);
                updated_elms[i].style[original_rule.trim()] = splits.join(":").trim();
              }
            }
          }
        }
      }
      if (!editor.node.isEmpty(editor.el)) {
        if (typeof keep_markers === "undefined") {
          keep_markers = false;
        }
        if (!editor.opts.fullPage) {
          html = editor.$el.html();
          if (editor.opts.iframe && editor.$html && editor.$html.find(".fr-element").length > 0) {
            html = editor.$html.find(".fr-element").html();
          }
        } else {
          html = getDoctype(editor.iframe_document);
          editor.$el.removeClass("fr-view");
          var heightMin = editor.opts.heightMin;
          var height = editor.opts.height;
          var heightMax = editor.opts.heightMax;
          editor.opts.heightMin = null;
          editor.opts.height = null;
          editor.opts.heightMax = null;
          editor.size.refresh();
          html += "<html".concat(editor.node.attributes(editor.$html.get(0)), ">").concat(editor.$html.html(), "</html>");
          if (editor.opts.iframe && editor.$html && editor.$html.find(".fr-element").length > 0) {
            html = editor.$html.find(".fr-element").html();
          }
          editor.opts.heightMin = heightMin;
          editor.opts.height = height;
          editor.opts.heightMax = heightMax;
          editor.size.refresh();
          editor.$el.addClass("fr-view");
        }
      } else if (editor.opts.fullPage) {
        html = getDoctype(editor.iframe_document);
        html += "<html".concat(editor.node.attributes(editor.$html.get(0)), ">").concat(editor.$html.find("head").get(0).outerHTML, "<body></body></html>");
      }
      if (!editor.opts.useClasses && !keep_classes) {
        for (i = 0; i < updated_elms.length; i++) {
          if (updated_elms[i].getAttribute("fr-original-class")) {
            updated_elms[i].setAttribute("class", updated_elms[i].getAttribute("fr-original-class"));
            updated_elms[i].removeAttribute("fr-original-class");
          }
          if (updated_elms[i].getAttribute("fr-original-style") !== null && typeof updated_elms[i].getAttribute("fr-original-style") !== "undefined") {
            if (updated_elms[i].getAttribute("fr-original-style").length !== 0) {
              updated_elms[i].setAttribute("style", updated_elms[i].getAttribute("fr-original-style"));
            } else {
              updated_elms[i].removeAttribute("style");
            }
            updated_elms[i].removeAttribute("fr-original-style");
          } else {
            updated_elms[i].removeAttribute("style");
          }
        }
      }
      if (editor.opts.fullPage) {
        html = html.replace(/<style data-fr-style="true">(?:[\w\W]*?)<\/style>/g, "");
        html = html.replace(/<link([^>]*)data-fr-style="true"([^>]*)>/g, "");
        html = html.replace(/<style(?:[\w\W]*?)class="firebugResetStyles"(?:[\w\W]*?)>(?:[\w\W]*?)<\/style>/g, "");
        html = html.replace(/<body((?:[\w\W]*?)) spellcheck="true"((?:[\w\W]*?))>((?:[\w\W]*?))<\/body>/g, "<body$1$2>$3</body>");
        html = html.replace(/<body((?:[\w\W]*?)) contenteditable="(true|false)"((?:[\w\W]*?))>((?:[\w\W]*?))<\/body>/g, "<body$1$3>$4</body>");
        html = html.replace(/<body((?:[\w\W]*?)) dir="([\w]*)"((?:[\w\W]*?))>((?:[\w\W]*?))<\/body>/g, "<body$1$3>$4</body>");
        html = html.replace(/<body((?:[\w\W]*?))class="([\w\W]*?)(fr-rtl|fr-ltr)([\w\W]*?)"((?:[\w\W]*?))>((?:[\w\W]*?))<\/body>/g, '<body$1class="$2$4"$5>$6</body>');
        html = html.replace(/<body((?:[\w\W]*?)) class=""((?:[\w\W]*?))>((?:[\w\W]*?))<\/body>/g, "<body$1$2>$3</body>");
      }
      if (editor.opts.htmlSimpleAmpersand) {
        html = html.replace(/&amp;/gi, "&");
      }
      editor.events.trigger("html.afterGet");
      if (!keep_markers) {
        html = html.replace(/<span[^>]*? class\s*=\s*["']?fr-marker["']?[^>]+>\u200b<\/span>/gi, "");
      }
      html = editor.clean.invisibleSpaces(html);
      function _processBR(br) {
        var parent_node = br.parentNode;
        if (parent_node && (editor.node.isBlock(parent_node) || editor.node.isElement(parent_node)) && [ "TD", "TH" ].indexOf(parent_node.tagName) < 0) {
          var prev_node = br.previousSibling;
          var next_node = br.nextSibling;
          while (prev_node && (prev_node.nodeType === Node.TEXT_NODE && prev_node.textContent.replace(/\n|\r/g, "").length === 0 || editor.node.hasClass(prev_node, "fr-tmp"))) {
            prev_node = prev_node.previousSibling;
          }
          if (next_node) {
            return false;
          }
          if (prev_node && parent_node && prev_node.tagName !== "BR" && !editor.node.isBlock(prev_node) && !next_node && parent_node.textContent.replace(/\u200B/g, "").length > 0 && prev_node.textContent.length > 0 && !editor.node.hasClass(prev_node, "fr-marker")) {
            if (!(editor.el === parent_node && !next_node && editor.opts.enter === FroalaEditor.ENTER_BR && editor.browser.msie)) {
              br.parentNode.removeChild(br);
            }
          }
        } else if (parent_node && !(editor.node.isBlock(parent_node) || editor.node.isElement(parent_node))) {
          if (!br.previousSibling && !br.nextSibling && editor.node.isDeletable(br.parentNode)) {
            _processBR(br.parentNode);
          }
        }
      }
      function _processOnGet(el) {
        editor.events.trigger("html.processGet", [ el ]);
        if (el && el.getAttribute && el.getAttribute("class") === "") {
          el.removeAttribute("class");
        }
        if (el && el.getAttribute && el.getAttribute("style") === "") {
          el.removeAttribute("style");
        }
        if (el && el.nodeType === Node.ELEMENT_NODE) {
          var els = el.querySelectorAll('[class=""],[style=""]');
          var i;
          for (i = 0; i < els.length; i++) {
            var _el = els[i];
            if (_el.getAttribute("class") === "") {
              _el.removeAttribute("class");
            }
            if (_el.getAttribute("style") === "") {
              _el.removeAttribute("style");
            }
          }
          if (el.tagName === "BR") {
            _processBR(el);
          } else {
            var brs = el.querySelectorAll("br");
            for (i = 0; i < brs.length; i++) {
              _processBR(brs[i]);
            }
          }
        }
      }
      html = editor.clean.exec(html, _processOnGet);
      var new_html = editor.events.chainTrigger("html.get", html);
      if (typeof new_html === "string") {
        html = new_html;
      }
      html = html.replace(/<pre(?:[\w\W]*?)>(?:[\w\W]*?)<\/pre>/g, function(str) {
        return str.replace(/<br>/g, "\n");
      });
      html = html.replace(/<meta((?:[\w\W]*?)) data-fr-http-equiv="/g, '<meta$1 http-equiv="');
      var isFontSizeDefaultSelection = editor.opts.fontSizeDefaultSelection && editor.opts.fontSizeUnit && editor.opts.fontSizeDefaultSelection != "Font Size";
      var isFontFamilyDefaultSelection = editor.opts.fontFamilyDefaultSelection && editor.opts.fontFamilyDefaultSelection != "Font Family";
      if (editor.opts.useClasses && !keep_classes && (isFontSizeDefaultSelection || isFontFamilyDefaultSelection)) {
        var styleString = "";
        if (isFontSizeDefaultSelection) {
          styleString += "font-size: ".concat(editor.opts.fontSizeDefaultSelection).concat(editor.opts.fontSizeUnit, ";");
        }
        if (isFontFamilyDefaultSelection) {
          styleString += "font-family: ".concat(editor.opts.fontFamilyDefaultSelection, ";");
        }
        if (editor.opts.fullPage) {
          var parser = new DOMParser();
          var htmlDoc = parser.parseFromString(html, "text/html");
          var styleTag = document.createElement("style");
          if (styleString) {
            styleTag.innerHTML = "body{".concat(styleString, "}");
            htmlDoc.head.appendChild(styleTag);
            html = "<!DOCTYPE html>".concat(htmlDoc.documentElement.outerHTML);
          }
        } else {
          var div = document.createElement("div");
          if (styleString) {
            div.style.cssText = styleString;
          }
          div.innerHTML = html;
          html = div.outerHTML;
        }
      }
      return html;
    };
    options = options || {};
    const imagePlugins = [ "image", "insertImage" ];
    if (options.externalParams.imageBrowseEnabled) {
      froalaDefaultConfig.pluginsEnabled.push(...imagePlugins);
    }
    options = $.extend({}, froalaDefaultConfig, options);
    const initializefroala = function(resolve) {
      require([ "csui/lib/froala_editor/js/froala_editor.pkgd.min", "css!csui/lib/froala_editor/css/froala_editor.pkgd.min", "css!csui/lib/froala_editor/css/themes/dark.min" ], function(FroalaEditor) {
        return resolve(new FroalaEditor(selector, options));
      });
    };
    return new Promise(function(resolve, reject) {
      let froalaLocale = i18n.settings.locale;
      if (LocalizationMappings.hasOwnProperty(froalaLocale)) {
        froalaLocale = LocalizationMappings[froalaLocale];
      }
      if (!froalaLocale) {
        initializefroala(resolve);
        return;
      }
      const languagePackPath = `csui/lib/froala_editor/js/languages/${froalaLocale}`;
      require([ languagePackPath ], function(lang) {
        options.language = froalaLocale;
        initializefroala(resolve);
      }, function(error) {
        initializefroala(resolve);
      });
    });
  };
  return bootstrapFroalaEditor;
});