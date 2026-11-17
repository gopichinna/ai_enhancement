/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/lib/marionette3", "csui/models/perspective/perspective.template.model", "csui/utils/contexts/factories/connector", "csui/models/perspective/personalization.model", "csui/utils/perspective/perspective.util", "hbs!csui/perspective.manage/impl/top.ribbon/top.ribbon.item", "csui/controls/perspective.actions/perspective.action.dropdown", "csui/perspective.manage/mixins/top.ribbon.item.mixin", "smart/themes/theming", "csui/themes/csui.jato.action.icons" ], function(Backbone, Marionette, PerspectiveTemplateModel, ConnectorFactory, PersonalizationModel, PerspectiveUtil, TopRibbonTemplate, PerspectiveSettingDropdown, TopRibbonItemMixin, theming, jatoActionIcons) {
  "use strict";
  let TopRibbonItemView = Marionette.View.extend({
    className: function() {
      let classNames = "csui-top-ribbon-item";
      if (this.model.isNew()) {
        classNames += " csui-edited-perspective";
      }
      return classNames;
    },
    template: TopRibbonTemplate,
    tagName: "li",
    regions: {
      perspectiveAction: ".csui-perspective-action",
      csuiPerspectiveName: ".csui-top-ribbon-name"
    },
    templateContext: function() {
      return {
        name: this.model.getTitle(),
        layout: this.model.getType(),
        isJATO: theming.isJATOTheme(),
        editDraftSVG: jatoActionIcons.actionEditLayout
      };
    },
    ui: {
      csuiTopRibbonLayout: ".csui-top-ribbon-layout",
      csuiPerspectiveLayout: ".csui-perspective-layout"
    },
    events: {
      "click @ui.csuiTopRibbonLayout": "serializePerspective",
      "mouseenter @ui.csuiPerspectiveLayout": "onHoverEnter",
      "mouseleave @ui.csuiPerspectiveLayout": "onHoverLeave",
      "keydown @ui.csuiTopRibbonLayout": "onkeydownLayout"
    },
    constructor: function TopRibbonItemView(options = {}) {
      this.options = options;
      Marionette.View.prototype.constructor.call(this, options);
      this.isPersonalizeMode = this.options.originatingView.mode === PerspectiveUtil.MODE_PERSONALIZE;
      this.perspectiveActionView = new PerspectiveSettingDropdown({
        view: this
      });
    },
    initialize: function() {
      this.model.on({
        "finish:serialize:welcomepage": this.onFinishSerializeWelcomePage.bind(this),
        "change:title": this.markPerspectiveAsModified.bind(this),
        "change:rules": this.markPerspectiveAsModified.bind(this),
        "change:departmentId": this.markPerspectiveAsModified.bind(this)
      });
      this.listenTo(this.model, "change:default", this.render);
      this.listenTo(this.model, "change:enabled", this.render);
      this.listenTo(this.model, "perspective:modified", this.markPerspectiveAsModified.bind(this));
    },
    onRender: async function() {
      this.model.get("default") ? this.el.classList.add("csui-default-perspective") : this.el.classList.remove("csui-default-perspective");
      this.updateDepartmentMap();
      if (this.isActiveChild(this.isPersonalizeMode)) {
        let pModel = this.options.originatingView?.perspective;
        if (!pModel?.get("id") && !!this.model.getPerspectiveId()) {
          pModel = new Backbone.Model(await this.fetchPerspective(this.isPersonalizeMode));
        }
        if (this.isPersonalizeMode) await this.updatePersonalizeModel(pModel); else this.updatePerspectiveModel(pModel);
        this.trigger("perspective:rendered", this);
      }
      if (!this.perspectiveActionView || this.perspectiveActionView.isDestroyed) {
        this.perspectiveActionView = new PerspectiveSettingDropdown({
          view: this
        });
      }
      this.showChildView("perspectiveAction", this.perspectiveActionView);
      this.perspectiveNameForm = this.buildPerspectiveNameFormField();
      this.showChildView("csuiPerspectiveName", this.perspectiveNameForm);
      if (this.model.has("enabled") && !this.model.get("enabled")) {
        this.ui.csuiTopRibbonLayout.addClass("csui-perspective-disabled");
      }
    },
    onFinishSerializeWelcomePage: function() {
      this.updatePerspective();
    },
    serializePerspective: async function() {
      if (this.el.classList.contains("binf-active")) return;
      const context = this.options.originatingView.context;
      context.triggerMethod("serialize:welcomepage", this.options.originatingView.perspective, null, this.model, true);
    },
    updatePerspective: async function() {
      if (this.model.get("hasOnlybasicPerspectiveInfo")) {
        const perspectiveInfo = await this.fetchPerspective(this.isPersonalizeMode);
        const pModel = new Backbone.Model(perspectiveInfo);
        if (this.isPersonalizeMode) {
          await this.updatePersonalizeModel(pModel);
        } else {
          this.updatePerspectiveModel(pModel);
        }
      }
      if (this.model.has("perspective") || this.isPersonalizeMode) this.loadPerspective();
    },
    updatePerspectiveModel: function(pModel) {
      this.model.set(pModel.toJSON(), {
        silent: true
      });
      if (this.model.has("hasOnlybasicPerspectiveInfo")) {
        this.model.set("hasOnlybasicPerspectiveInfo", false, {
          silent: true
        });
      }
    },
    updatePersonalizeModel: async function(pModel) {
      let filteredPerspective = {};
      let perspective = pModel.get("perspective");
      perspective.id = this.model.getPerspectiveId();
      pModel.set("perspective", perspective);
      filteredPerspective.perspective_id = this.model.getPerspectiveId();
      Object.keys(perspective).map(function(key) {
        if ([ "type", "options" ].includes(key)) filteredPerspective[key] = perspective[key];
      });
      this.model.options.perspective = filteredPerspective;
      this.model.setPerspective(filteredPerspective);
      let peronalize = await PersonalizationModel.loadPersonalization(pModel);
      if (!!peronalize) this.model.setPerspective(peronalize);
      this.model.set("hasOnlybasicPerspectiveInfo", false, {
        silent: true
      });
    },
    isActiveChild: function() {
      if (this.isPersonalizeMode) {
        return this.model.getPerspectiveId() && this.model.getPerspectiveId() === this.options.originatingView?.perspective?.getPerspectiveId();
      } else {
        return this.model.get("title") === this.options.originatingView?.perspective?.get("title");
      }
    },
    loadPerspective: function() {
      const context = this.options.originatingView.context;
      let perspectiveConfig = this.model.getPerspective();
      perspectiveConfig.options.perspectiveMode = this.options.originatingView.mode;
      let perspectiveModel = new Backbone.Model(perspectiveConfig);
      perspectiveModel && context.triggerMethod("enter:edit:perspective", perspectiveModel);
      this.listenToOnce(context, "finish:enter:edit:perspective", function() {
        this.trigger("perspective:rendered", this);
      });
    },
    fetchPerspective: async function(getPersonalizeInfo = false) {
      const perspectiveTemplate = new PerspectiveTemplateModel({
        id: this.model.getPerspectiveId(),
        personalize: getPersonalizeInfo
      }, {
        connector: this.options.originatingView.context.getObject(ConnectorFactory)
      });
      const model = await perspectiveTemplate.fetch();
      if (model?.perspectives.length) {
        let perspective = model.perspectives[0];
        if (this.isPersonalizeMode) {
          perspective.perspective.id = perspective.av_id;
        }
        return model.perspectives[0];
      }
    },
    onHoverEnter: function() {
      this.perspectiveActionView.alignActionDropDown();
    },
    onHoverLeave: function() {
      this.perspectiveActionView.closeMenu();
    },
    onClickPerspectiveName: function(options) {
      this.setPerspectiveNameFormFieldReadOnly(false);
      this.perspectiveNameForm?.el.querySelector(".cs-field-read")?.click();
    },
    updateDepartmentMap: function() {
      const departmentId = this.model.get("departmentId");
      departmentId?.length && (this.options.originatingView.departmentMap[this.model.get("title")] = departmentId);
    },
    onkeydownLayout: function(event) {
      let toolButtons;
      switch (event.key) {
       case "Enter":
        this.serializePerspective();
        break;

       case "ArrowLeft":
        break;

       case "ArrowRight":
        event.preventDefault();
        this.perspectiveActionView.ui.dropdownToggle[0]?.focus();
        break;

       case "Tab":
        if (event.shiftKey && event.key === "Tab") {
          toolButtons = document.querySelectorAll(".pman-right-tools button");
          toolButtons[toolButtons.length - 1].focus();
        } else {
          if (this.isPersonalizeMode) {
            this.options.originatingView._setFocusOnFirstWidget(event);
          } else {
            document.querySelectorAll(".csui-pman-sidebar-ribbon otc-button")[0]?.focus();
          }
          event.preventDefault();
        }
      }
    }
  });
  TopRibbonItemMixin.mixin(TopRibbonItemView.prototype);
  return TopRibbonItemView;
});