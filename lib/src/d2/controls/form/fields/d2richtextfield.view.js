/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/dialog/dialog.view", "csui/controls/form/fields/base/csformfield.view", "csui/utils/froala/bootstrap", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "dctmw/utils/utils", "dctmw/utils/authenticators/session", "i18n!d2/controls/form/impl/nls/lang", "i18n!d2/controls/form/impl/d2richtext/nls/lang", "hbs!d2/controls/form/impl/d2richtext/d2expandedrichtextfield", "hbs!d2/controls/form/impl/d2richtext/d2richtextfield", "css!d2/controls/form/impl/d2richtext/d2richtextfield" ], function(_, $, Backbone, Marionette, DialogView, FormFieldView, BootstrapFroalaEditor, TabableRegionBehavior, utils, Session, lang, richTextLang, expandedViewTemplate, template) {
  "use strict";
  const IGNORED_BASIC_HTML_TAGS = [ "style", "link", "script" ];
  const IGNORED_FORM_FIELD_TAGS = [ "form", "button", "textarea", "select", "option", "optgroup", "input", "output" ];
  const IGNORED_RICH_MEDIA_TAGS = [ "svg", "img", "video", "audio", "track", "source", "area", "base" ];
  const IGNORED_EXTERNAL_RESOURCE_TAGS = [ "object", "embed", "iframe" ];
  const IGNORE_OTHER_TAGS = [ "plaintext" ];
  const IGNORED_HTML_TAGS = IGNORED_BASIC_HTML_TAGS.concat(IGNORED_FORM_FIELD_TAGS).concat(IGNORED_RICH_MEDIA_TAGS).concat(IGNORED_EXTERNAL_RESOURCE_TAGS).concat(IGNORE_OTHER_TAGS);
  const ALLOWED_HTML_ATTR = [ "accept", "accept-charset", "accesskey", "action", "align", "allowfullscreen", "allowtransparency", "alt", "async", "autocomplete", "autofocus", "autoplay", "autosave", "background", "bgcolor", "border", "charset", "cellpadding", "cellspacing", "checked", "cite", "class", "color", "cols", "colspan", "content", "contenteditable", "contextmenu", "controls", "coords", "data", "data-.*", "datetime", "default", "defer", "dir", "dirname", "disabled", "download", "draggable", "dropzone", "enctype", "for", "form", "formaction", "frameborder", "headers", "height", "hidden", "high", "href", "hreflang", "http-equiv", "icon", "id", "ismap", "itemprop", "keytype", "kind", "label", "lang", "language", "list", "loop", "low", "max", "maxlength", "media", "method", "min", "mozallowfullscreen", "multiple", "muted", "name", "novalidate", "open", "optimum", "pattern", "ping", "placeholder", "playsinline", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "reversed", "rows", "rowspan", "sandbox", "scope", "scoped", "scrolling", "seamless", "selected", "shape", "size", "sizes", "span", "src", "srcdoc", "srclang", "srcset", "start", "step", "summary", "spellcheck", "style", "title", "type", "translate", "usemap", "value", "valign", "webkitallowfullscreen", "width", "wrap" ];
  function getFroalaOptions(view) {
    if (!view) {
      throw new Error("Marionette view is mandatory enabling froala options");
    }
    return {
      placeholderText: richTextLang.richTextEditorPlaceHolder,
      externalParams: {},
      autofocus: false,
      useClasses: true,
      linkAutoPrefix: "https://",
      htmlRemoveTags: IGNORED_HTML_TAGS,
      htmlAllowedAttrs: ALLOWED_HTML_ATTR,
      pluginsEnabled: [ "codeView", "align", "colors", "fontFamily", "fontSize", "link", "lists", "paragraphFormat", "help" ],
      events: {
        initialized: function() {
          view.triggerMethod("html:field:init", this);
        },
        contentChanged: function() {
          var htmlContent = this.html.get().trim();
          view.triggerMethod("html:field:changed", this, htmlContent);
        },
        "html.set": function() {
          view.triggerMethod("html:field:value:set", this);
        },
        "commands.after": function(cmd) {
          let htmlEditor = this;
          if (cmd === "html") {
            let isCodeViewActive = htmlEditor.codeView.isActive(), $codeTextAreaEl = this.$el.siblings("textarea.fr-code"), isDctmEventEnabled = $codeTextAreaEl.attr("dctm-event-enabled");
            view.triggerMethod("html:field:code:mode:switch", isCodeViewActive);
            if (isDctmEventEnabled !== "true" && isCodeViewActive) {
              $codeTextAreaEl.attr("dctm-event-enabled", "true");
              $codeTextAreaEl.on("input", _.throttle(() => {
                let codeContent = htmlEditor.codeView.get().trim(), htmlContent = this.clean.html(codeContent).trim(), invalidHtmlContent = false;
                if (codeContent !== htmlContent) {
                  invalidHtmlContent = true;
                }
                view.triggerMethod("html:field:code:changed", this, htmlContent, codeContent, invalidHtmlContent);
              }), 500);
              $codeTextAreaEl.on("blur", () => {
                view.triggerMethod("html:field:focusout", this);
              });
            }
          } else if (cmd === "insertLink" || cmd === "linkEdit") {
            let $popup = $(this.popups.get("link.insert")), $openInNewTabLinkCB = $popup.find(".fr-checkbox-line");
            if ($openInNewTabLinkCB.length > 0) {
              $openInNewTabLinkCB.remove();
            }
            view.triggerMethod("html:field:manage:link", this, cmd);
          }
        },
        blur: function() {
          view.triggerMethod("html:field:focusout", this);
        }
      },
      helpSets: [ {
        title: richTextLang.basicFormatting,
        commands: [ {
          val: "OSkeyB",
          desc: richTextLang.formatBold
        }, {
          val: "OSkeyI",
          desc: richTextLang.formatItalic
        }, {
          val: "OSkeyU",
          desc: richTextLang.formatUnderline
        }, {
          val: "OSkeyS",
          desc: richTextLang.formatStrikethrough
        }, {
          val: "OSkey]",
          desc: richTextLang.formatIncreaseIndent
        }, {
          val: "OSkey[",
          desc: richTextLang.formatDecreaseIndent
        } ]
      }, {
        title: richTextLang.navigation,
        commands: [ {
          val: "OSkey/",
          desc: richTextLang.navigationShortcuts
        }, {
          val: "Alt+F10",
          desc: richTextLang.navigationFocusToolbar
        }, {
          val: "Esc",
          desc: richTextLang.navigationReturn
        } ]
      } ]
    };
  }
  var ExpandedRichTextView = Marionette.ItemView.extend({
    constructor: function() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.fieldView = this.options.fieldView;
      this.enabled = this.fieldView.enabled;
      this.isReadOnly = this.options.mode !== "writeonly";
    },
    className: "expanded-rich-text-editor",
    template: expandedViewTemplate,
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    ui: {
      richTextFieldTextArea: ".rich-text-field",
      richTextContentLength: ".rich-text-content-length",
      richTextContentError: ".error-message"
    },
    events: {
      keyup: "_onKeyup"
    },
    _onKeyup: function(event) {
      event.stopPropagation();
    },
    templateHelpers: function() {
      return {
        data: this.fieldView.getValue(),
        readOnlyMode: this.isReadOnly
      };
    },
    onRender: function() {
      this._renderRichTextEditor();
    },
    _renderRichTextEditor: function() {
      if (this.isReadOnly === true) {
        return;
      }
      var froalaOptions = getFroalaOptions(this);
      froalaOptions.toolbarButtons = {
        moreText: {
          buttons: [ "bold", "italic", "underline", "strikeThrough", "subscript", "superscript", "fontSize", "textColor", "backgroundColor" ],
          buttonsVisible: 9
        },
        moreParagraph: {
          buttons: [ "alignLeft", "alignCenter", "alignRight", "alignJustify", "outdent", "indent", "formatOL", "formatUL", "paragraphFormat" ],
          buttonsVisible: 9
        },
        moreRich: {
          buttons: [ "insertLink", "insertHR" ],
          buttonsVisible: 2
        },
        moreMisc: {
          buttons: [ "clearFormatting", "html", "help" ],
          buttonsVisible: 3,
          align: "right"
        }
      };
      froalaOptions.heightMax = "600";
      froalaOptions.autofocus = true;
      BootstrapFroalaEditor(this.ui.richTextFieldTextArea[0], froalaOptions).then(htmlEditor => {
        this.htmlEditorInstance = htmlEditor;
      });
    },
    getHtmlContent: function() {
      return this.ui.richTextFieldTextArea.val();
    },
    onHtmlFieldInit: function(htmlEditor) {
      if (this.options.isCodeView === true && htmlEditor.codeView.isActive() !== true) {
        htmlEditor.codeView.toggle();
        htmlEditor.events.trigger("commands.after", [ "html" ]);
      }
      if (!this.enabled) {
        htmlEditor.edit.off();
        htmlEditor.$el.siblings("textarea.fr-code").attr("disabled", true);
      }
      this.updateContentLength(htmlEditor.html.get());
    },
    onHtmlFieldCodeModeSwitch: function(isEnabled) {
      if (isEnabled !== true && this.hasInvalidHtmlContent === true) {
        this.hasInvalidHtmlContent = false;
      }
      this.updateContentLength(this.htmlEditorInstance?.html.get());
    },
    onHtmlFieldCodeChanged: function(htmlEditor, htmlContent, codeContent, invalidHtmlContent) {
      if (invalidHtmlContent === true) {
        this.hasInvalidHtmlContent = true;
        this.updateContentLength(codeContent);
      } else {
        this.hasInvalidHtmlContent = false;
        this.onHtmlFieldChanged(htmlEditor, htmlContent);
      }
    },
    onHtmlFieldChanged: function(htmlEditor, htmlContent) {
      this.updateContentLength(htmlContent);
      this.ui.richTextFieldTextArea.val(htmlContent);
    },
    updateContentLength: function(htmlContent) {
      var charCount = htmlContent ? htmlContent.length : 0, charLengthMessage = this.fieldView.getCurrentCharacterCount(charCount);
      this.ui.richTextContentLength.text(charLengthMessage);
      this.updateValidationMessage(htmlContent);
    },
    updateValidationMessage: function(htmlContent) {
      var errorMessage;
      if (this.hasInvalidHtmlContent === true) {
        errorMessage = richTextLang.richTextEditorInvalidHtmlError;
      } else {
        var charCount = htmlContent ? htmlContent.length : 0, maxLength = this.fieldView.getFieldMaxLength(), fieldTitle = this.fieldView.getFieldTitle();
        if (maxLength && charCount > maxLength) {
          errorMessage = _.str.sformat(richTextLang.richTextEditorCharacterLengthError, fieldTitle, maxLength);
        }
      }
      if (errorMessage) {
        this.ui.richTextContentError.text(errorMessage);
        this.ui.richTextContentError.removeClass("binf-hidden");
      } else {
        this.ui.richTextContentError.text("");
        this.ui.richTextContentError.addClass("binf-hidden");
      }
      this.triggerMethod("html:field:content:valid", errorMessage);
    },
    currentlyFocusedElement: function() {
      return this.$el.find("*[contenteditable]");
    },
    onLastTabElement: function() {
      return this.$el.find("*[contenteditable]");
    },
    onDestroy: function() {
      this.htmlEditorInstance?.destroy();
    },
    getHtmlEditor: function() {
      return this.htmlEditorInstance;
    },
    onAfterShow: function() {
      let tabFocusableSelector = "*[tabindex]";
      this.htmlEditorInstance?.$el.find(tabFocusableSelector).removeAttr("tabindex");
    },
    onHtmlFieldManageLink: function(htmlEditor, cmdName) {
      if (cmdName === "linkEdit") {
        let $popup = $(htmlEditor.popups.get("link.insert")), linkInputs = $popup.find("input.fr-link-attr");
        if (linkInputs.length > 0) {
          linkInputs.each((index, input) => {
            let $input = $(input);
            if ($input.attr("dctm-event-enabled") !== "true") {
              $input.attr("dctm-event-enabled", "true");
              $input.on("focusin", event => {
                event.stopPropagation();
              });
            }
          });
        }
      }
    }
  });
  return FormFieldView.extend({
    constructor: function D2RichTextFieldView(options) {
      this.prepareOptions(options);
      FormFieldView.prototype.constructor.apply(this, arguments);
    },
    prepareOptions: function(options) {
      if (options?.alpaca?.options?.enableHtmlEditor !== true && options?.alpaca?.schema?.readonly !== true) {
        options.alpaca.schema.readonly = true;
      }
    },
    ui: {
      readField: ".cs-field-read .cs-field-richtext-data",
      writeField: ".cs-field-write .rich-text-field",
      expandContent: ".expand-field",
      richTextContentLength: ".rich-text-content-length"
    },
    events: {
      "click @ui.readField": "onClickLink",
      "click @ui.expandContent": "onExpandRichTextContent",
      "keyup @ui.expandContent": "onKeyUpExpand"
    },
    className: "cs-formfield cs-richtextfield",
    template: template,
    templateHelpers: function() {
      var templateHelper = FormFieldView.prototype.templateHelpers.apply(this);
      templateHelper.tooltip = "";
      var pseudoElem = $("<div></div>");
      pseudoElem.html(this.model.get("data"));
      _.extend(templateHelper, {
        writeonlyMode: this.mode === "writeonly",
        readModeAria: _.str.sformat(lang.fieldReadOnlyAria, this.model.get("options").label, pseudoElem.text()),
        expand: richTextLang.expand
      });
      return templateHelper;
    },
    onClickLink: function(e) {
      e.stopPropagation();
    },
    onRender: function() {
      var me = this, disableExpand = this.options.alpaca.options.disableExpand;
      if (this.mode === "writeonly") {
        this._renderRichTextEditor();
        if (disableExpand === true) {
          this.ui.expandContent.addClass("binf-hidden");
        }
      } else {
        this.$el.parent().removeClass("cs-field-text-nospace");
        if (this.options.alpaca.options.stretch === true) {
          this.$el.closest(".binf-col-sm-9").addClass("d2-richtext-field-width");
        }
        if (disableExpand === true) {
          this.ui.expandContent.addClass("binf-hidden");
        } else {
          this.$el.addClass("fixed-height-content");
          var htmlContent = me.getValue();
          if (!htmlContent || htmlContent.length === 0) {
            this.ui.expandContent.addClass("binf-hidden");
          }
        }
      }
    },
    onDestroy: function() {
      this.htmlEditorInstance?.destroy();
    },
    _renderRichTextEditor: function() {
      var me = this, froalaOptions = getFroalaOptions(this);
      froalaOptions.toolbarButtons = {
        moreText: {
          buttons: [ "bold", "italic", "underline", "strikeThrough", "subscript", "superscript", "fontSize", "textColor", "backgroundColor" ],
          buttonsVisible: 0
        },
        moreParagraph: {
          buttons: [ "alignLeft", "alignCenter", "alignRight", "alignJustify", "outdent", "indent", "formatOL", "formatUL", "paragraphFormat" ],
          buttonsVisible: 0
        },
        moreRich: {
          buttons: [ "insertLink", "insertHR" ],
          buttonsVisible: 0
        },
        moreMisc: {
          buttons: [ "clearFormatting", "html", "help" ],
          buttonsVisible: 0
        }
      };
      froalaOptions.zIndex = 0;
      froalaOptions.heightMin = 100;
      froalaOptions.heightMax = 250;
      BootstrapFroalaEditor(me.ui.writeField[0], froalaOptions).then(htmlEditor => {
        this.htmlEditorInstance = htmlEditor;
      });
    },
    _showCharCount: function() {
      var htmlContent = this.getRichTextContent(), charCount = htmlContent ? htmlContent.length : 0;
      this.updateCharCount(charCount);
    },
    _updateHtmlContent: function() {
      var htmlContent = this.model.get("data");
      this.htmlEditorInstance?.html.set(htmlContent);
      this.ui.writeField.val(htmlContent);
      if (this.htmlEditorInstance?.codeView?.isActive() === true) {
        this.htmlEditorInstance?.$el.siblings("textarea.fr-code").val(htmlContent);
      }
      this._showCharCount();
    },
    reinit: function() {
      this._updateHtmlContent();
    },
    validateHtmlContent: function(callback) {
      if (this.hasInvalidHtmlContent === true) {
        callback({
          status: false,
          message: richTextLang.richTextEditorInvalidHtmlError
        });
      } else {
        callback({
          status: true
        });
      }
    },
    onHtmlFieldCodeModeSwitch: function(isEnabled) {
      if (isEnabled !== true && this.hasInvalidHtmlContent === true) {
        this.hasInvalidHtmlContent = false;
        this.alpacaField.refreshValidationState(false);
      }
      this._showCharCount();
    },
    onHtmlFieldCodeChanged: function(htmlEditor, htmlContent, codeContent, invalidHtmlContent) {
      if (invalidHtmlContent === true) {
        this.hasInvalidHtmlContent = true;
        this.updateCharCount(codeContent.length);
      } else {
        this.hasInvalidHtmlContent = false;
        this.onHtmlFieldChanged(htmlEditor, htmlContent);
      }
    },
    onHtmlFieldChanged: function(htmlEditor, htmlContent) {
      this.updateCharCount(htmlContent.length);
      this.ui.writeField.val(htmlContent);
    },
    onHtmlFieldFocusout: function() {
      this.ui.writeField.trigger("focusout");
    },
    onHtmlFieldInit: function(htmlEditor) {
      setTimeout(() => {
        let tabFocusableSelector = "*[tabindex]";
        htmlEditor.$el.find(tabFocusableSelector).removeAttr("tabindex");
      }, 250);
      this.enableDisableHtmlEditor();
      this._showCharCount();
    },
    getFieldMaxLength: function() {
      return this.alpacaField?.schema?.maxLength;
    },
    getFieldTitle: function() {
      return this.options.alpaca.schema.title;
    },
    getCurrentCharacterCount: function(charLength) {
      var maxLength = this.getFieldMaxLength();
      if (maxLength) {
        return _.str.sformat(richTextLang.richTextEditorCharacterLengthWithMax, charLength, maxLength);
      }
      return _.str.sformat(richTextLang.richTextEditorCharacterLength, charLength);
    },
    updateCharCount: function(charLength) {
      this.ui.richTextContentLength.text(this.getCurrentCharacterCount(charLength));
    },
    getRichTextContent: function() {
      var htmlContent = this.htmlEditorInstance?.html.get();
      return htmlContent;
    },
    allowEditOnEnter: function() {
      return false;
    },
    allowEditOnClickReadArea: function() {
      return false;
    },
    getDisplayValue: function() {
      return this.getValue();
    },
    enableDisableField: function(enabled) {
      this.enabled = enabled;
      this.enableDisableHtmlEditor();
    },
    enableDisableHtmlEditor: function() {
      if (this.enabled) {
        this.htmlEditorInstance?.edit.on();
        this.htmlEditorInstance?.$el.siblings("textarea.fr-code").removeAttr("disabled");
      } else {
        this.htmlEditorInstance?.edit.off();
        this.htmlEditorInstance?.$el.siblings("textarea.fr-code").attr("disabled", true);
      }
    },
    onKeyUpExpand: function(event) {
      if (this.mode === "writeonly" && (event.keyCode === 32 || event.keyCode === 13)) {
        this.onExpandRichTextContent();
        event.stopPropagation();
        event.preventDefault();
      }
    },
    onExpandRichTextContent: function() {
      var me = this, expandedRichTextView = new ExpandedRichTextView({
        isCodeView: this.htmlEditorInstance?.codeView?.isActive(),
        mode: this.mode,
        fieldView: this
      }), dialogOptions = {
        title: this.options.alpaca.schema.title,
        largeSize: true,
        view: expandedRichTextView,
        className: "expanded-html-editor-dialog"
      };
      if (this.mode === "writeonly" && this.enabled) {
        dialogOptions.buttons = [ {
          id: "save",
          label: lang.save,
          variant: "primary",
          disabled: true,
          close: true,
          click: function() {
            var htmlContent = expandedRichTextView.getHtmlContent(), htmlEditor = expandedRichTextView.getHtmlEditor();
            me.setValue(htmlContent, true);
            me._updateHtmlContent();
            if (me.htmlEditorInstance?.codeView?.isActive() === true && htmlEditor.codeView.isActive() !== true) {
              me.htmlEditorInstance?.codeView?.toggle();
            }
          }
        }, {
          id: "cancel",
          label: lang.cancel,
          close: true
        } ];
      }
      var editorDialogView = new DialogView(dialogOptions);
      editorDialogView.listenTo(Session.get(), "end", editorDialogView.destroy);
      editorDialogView.show();
      this.listenTo(expandedRichTextView, "html:field:content:valid", error => {
        var disabledFlag = !!error;
        editorDialogView.footerView.updateButton("save", {
          disabled: disabledFlag
        });
      });
      this.listenTo(editorDialogView, "destroy", () => {
        me.htmlEditorInstance?.events.focus();
      });
    }
  });
});