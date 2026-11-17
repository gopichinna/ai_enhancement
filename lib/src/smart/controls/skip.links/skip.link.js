/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "hbs!smart/controls/skip.links/impl/skip.link", "i18n!smart/controls/skip.links/impl/nls/lang", "css!smart/controls/skip.links/impl/skip.links" ], function(_, Marionette, template, lang) {
  "use strict";
  let SkipLinkView = Marionette.ItemView.extend({
    tagName: "otc-link",
    attributes: function() {
      let attributes = this?.model?.attributes?.attributes ?? {}, attrs = {
        type: attributes?.type ?? "normal",
        arialabel: attributes?.arialabel ?? "",
        skiplink: attributes?.skiplink ?? "",
        href: attributes?.href ?? "",
        target: attributes?.target ?? "_self",
        id: attributes?.id ?? ""
      };
      return attrs;
    },
    template: template,
    events: {
      keydown: "onKeyInView"
    },
    onKeyInView: function(event) {
      let code = event?.keyCode ?? "";
      if (code === 13 || code === 32) {
        const callbackFun = _.isFunction(this.model.attributes.execute) ? this.model.attributes.execute : this._defaultExecuteFunction;
        if (_.isFunction(this.model.get("execute"))) {
          event.preventDefault();
        }
        callbackFun(this.model);
      }
    },
    templateHelpers: function() {
      let messages = {
        label: this?.model?.attributes?.title ?? this?.model?.attributes?.label ?? this?.model?.attributes?.attributes?.arialabel ?? lang.skipLabel
      };
      return messages;
    },
    constructor: function SkipLinkView(options = {}) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    _defaultExecuteFunction: function(args) {}
  });
  return SkipLinkView;
});