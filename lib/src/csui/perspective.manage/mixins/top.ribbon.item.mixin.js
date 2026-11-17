/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/controls/form/form.view", "smart/controls/globalmessage/globalmessage", "i18n!csui/perspective.manage/impl/nls/lang" ], function(Backbone, FormView, GlobalMessage, lang) {
  "use strict";
  let TopRibbonItemMixin = {
    mixin: function(prototype) {
      return Object.assign(prototype, {
        buildPerspectiveNameFormField: function() {
          let self = this;
          const title = this.model.get("title");
          const formModel = new Backbone.Model({
            data: {
              perspectiveName: title
            },
            options: {
              fields: {
                perspectiveName: {
                  type: "text",
                  events: {
                    change: this.renamePerspective.bind(self),
                    focusout: this.onFocusOutWrite.bind(self)
                  }
                }
              }
            },
            schema: {
              type: "object",
              properties: {
                perspectiveName: {
                  readonly: true,
                  type: "string"
                }
              }
            }
          });
          return new FormView({
            mode: "update",
            model: formModel,
            context: this.options.context
          });
        },
        renamePerspective: function(event) {
          const view = event.target;
          let pName = view.value?.trim();
          if (pName === "") {
            view.value = view.defaultValue;
          } else {
            if (this.options.parentView.getPerspectiveByTitle(pName)) {
              let errorMsg = lang.perspectiveNameExists.replace("{0}", pName);
              GlobalMessage.showMessage("error", errorMsg);
              view.value = view.defaultValue;
            } else {
              this.model.set("title", pName);
              delete this.options.originatingView.departmentMap[view.defaultValue];
              this.updateDepartmentMap();
            }
          }
        },
        markPerspectiveAsModified: async function(model) {
          if (this.model.has("hasOnlybasicPerspectiveInfo")) {
            if (this.model.get("hasOnlybasicPerspectiveInfo")) {
              const changedAttributes = model.changedAttributes();
              const perspectiveInfo = await this.fetchPerspective(this.isPersonalizeMode);
              const pModel = new Backbone.Model(perspectiveInfo);
              this.updatePerspectiveModel(pModel);
              Object.keys(changedAttributes).forEach(key => this.model.set(key, changedAttributes[key]));
            }
            this.model.unset("hasOnlybasicPerspectiveInfo", {
              silent: true
            });
            this.el.classList.add("csui-edited-perspective");
            this.options.originatingView.toggleAddNewPageBtn(++this.model.collection.modifiedCount);
          }
          this.el.classList.remove("csui-server-error-perspective");
          this.options.originatingView.trigger("toggle:save");
        },
        unmarkPerspectiveAsModified: function() {
          if (this.el.classList.contains("csui-edited-perspective")) {
            this.el.classList.remove("csui-edited-perspective");
            this.options.originatingView.toggleAddNewPageBtn(--this.model.collection.modifiedCount);
            this.options.originatingView.trigger("toggle:save");
          }
        },
        onFocusOutWrite: function(event) {
          this.setPerspectiveNameFormFieldReadOnly(true);
          this.el.querySelector(".csui-top-ribbon-layout").focus();
        },
        setPerspectiveNameFormFieldReadOnly(readonly) {
          if (this.perspectiveNameForm?.alpaca?.schema?.properties?.perspectiveName) {
            this.perspectiveNameForm.alpaca.schema.properties.perspectiveName.readonly = readonly;
          }
        }
      });
    }
  };
  return TopRibbonItemMixin;
});