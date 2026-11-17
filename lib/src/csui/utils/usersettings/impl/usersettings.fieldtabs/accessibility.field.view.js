/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "csui/models/form", "csui/models/forms", "csui/controls/form/form.view", "csui/utils/contexts/page/page.context", "csui/utils/usersettings/impl/usersettings.model", "i18n!csui/utils/usersettings/impl/nls/lang", "css!csui/utils/usersettings/impl/usersettingstab" ], function($, _, Marionette, FormModel, FormCollection, FormView, PageContext, UserSettingsModel, lang) {
  "use strict";
  var AccessibilityFieldView = Marionette.ItemView.extend({
    constructor: function(options) {
      this.model = new UserSettingsModel(options);
      Marionette.ItemView.prototype.constructor.apply(this);
    },
    tagName: "div",
    template: false,
    getRawFormsData: function(state) {
      return {
        forms: [ {
          data: {
            accessibleMode: state
          },
          options: {
            fields: {
              accessibleMode: {
                hidden: false,
                label: lang.accModeLabel,
                type: "checkbox",
                helper: lang.accModeText
              }
            }
          },
          schema: {
            properties: {
              accessibleMode: {
                readonly: false,
                required: false,
                type: "boolean"
              }
            },
            title: lang.accHeader,
            type: "object"
          }
        } ]
      };
    },
    onRender: function() {
      this.model.fetch({
        prepare: false,
        async: false
      });
      var accModeCheckedState = this.model.get("accessibleMode"), formModels = new FormCollection();
      formModels.reset(formModels.parse(this.getRawFormsData(accModeCheckedState)));
      var singleModel = new FormModel(formModels.models[0].attributes.forms[0]), contentRegion = new Marionette.Region({
        el: this.el
      }), formView = new FormView({
        context: new PageContext(),
        model: singleModel,
        mode: "create"
      });
      this.listenTo(formView, "change:field", function(event) {
        let requestObj;
        let suw_view = this.$el.parents("div.esoc-simple-user-widget-view")[0];
        var accessibleMode = event.value;
        requestObj = {
          SmartUI: {
            accessibleMode: accessibleMode
          }
        };
        this.model.set({
          requestObj: requestObj
        });
        this.model.save();
        $(suw_view).addClass("csui-dialog-page-reload");
      }, this);
      this.listenTo(formView, "render:form", function(event) {
        this.trigger("childview:rendered");
      }, this);
      contentRegion.show(formView);
    }
  });
  return AccessibilityFieldView;
});