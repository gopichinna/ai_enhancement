/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/app.header/app.header.controls", "smart/behaviors/app.header/app.header.control.behavior", "smart/controls/app.header/menu/smart.menu.view", "smart/controls/app.header/badge/smart.badge.view", "smart/controls/app.header/search/search.box.view", "smart/controls/globalmessage/globalmessage", "smart/controls/skip.links/skip.links", "smart/controls/app.header/panel/smart.panel.view", "hbs!smart/controls/app.header/impl/app.header", "i18n!smart/controls/app.header/impl/nls/lang", "css!smart/controls/app.header/impl/app.header", "smart/themes/carbonfiber/ot-icons/icons_smart_action_header", "smart/utils/otwc.loader" ], function(require, module, _, $, Backbone, Marionette, controls, SmartAppHeaderControlBehavior, MenuView, BadgeView, SearchBoxView, SmartGlobalMessage, SkipLinksCollectionView, SmartPanelView, template, lang) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    enableMinimiseButtonOnProgressPanel: true
  });
  const SCHEMA_ASSOSIATIONS = {
    logo: {
      tagName: "otc-brand",
      attributes: {
        slot: "brand",
        dark: "",
        logosrc: "",
        logourl: "",
        logoalttext: "",
        tooltipbrand: "",
        primarytext: "",
        secondarytext: "",
        versiontext: "",
        arialabel: "",
        title: ""
      }
    },
    progress: {
      tagName: "otc-progress-icon",
      attributes: {
        slot: "",
        class: "",
        iconappearance: "",
        headeritem: "",
        arialabel: "",
        title: "",
        from: "",
        to: "",
        state: ""
      }
    },
    search: {
      tagName: "otc-search-slidein",
      attributes: {
        slot: "beforeOverflow",
        class: "",
        iconappearance: "",
        headeritem: "",
        arialabel: "",
        title: "",
        arialabelsearchbutton: "",
        tooltipsearchbuttonopen: "",
        tooltipsearchbutton: "",
        tooltipclearkeywords: "",
        tooltipstartsearch: ""
      }
    },
    button: {
      tagName: "otc-toolbaritem",
      attributes: {
        slot: "",
        icon: "",
        iconappearance: "",
        headeritem: "",
        arialabel: "",
        title: "",
        className: "",
        overflowValue: ""
      }
    },
    default: {
      tagName: "otc-toolbaritem",
      attributes: {
        slot: "",
        icon: "",
        iconappearance: "",
        headeritem: "",
        arialabel: "",
        title: "",
        className: "",
        overflowValue: ""
      }
    },
    badge: {
      tagName: "otc-button",
      attributes: {
        slot: "beforeOverflow",
        icon: "",
        headeritem: "",
        arialabel: "",
        title: "",
        badgeValue: "",
        className: "",
        overflowValue: ""
      }
    },
    menu: {
      tagName: "otc-avatar",
      attributes: {
        id: "",
        slot: "afterOverflow",
        iconappearance: "",
        initials: "",
        interactive: "",
        image: "",
        icon: "",
        headeritem: "",
        arialabel: "",
        title: ""
      }
    },
    "button-menu": {
      tagName: "otc-button",
      attributes: {
        id: "",
        slot: "afterOverflow",
        iconappearance: "",
        icon: "",
        headeritem: "",
        arialabel: "",
        title: "",
        overflowValue: ""
      }
    }
  };
  var AppHeaderView = Marionette.LayoutView.extend({
    template: template,
    className: "smart-app-header-wrapper",
    regions: {
      messageRegion: ".csui-navbar-message"
    },
    ui: {
      right: "otc-header-bar",
      skipLinks: ".smart-app-header-otc-skiplinks",
      overflow: "otc-overflow-container",
      burgerMenu: ".smart-app-header-otc-burger-menu-view",
      burgerMenuBtn: "otc-button.smart-app-header-burger-menu-btn"
    },
    templateHelpers: function() {
      let messages = {
        transparentAttribute: this.options.transparent ? "transparent" : "",
        enableSkipLinks: this?.options?.enableSkipLinks ?? false,
        enableHamburger: this.enableHamburger && this.readyToRender,
        overflowAria: lang.overflowMenuAria,
        burgerTitle: lang.openMenuTitle,
        burgerAriaLabel: lang.openMenuTitle,
        iconApperance: this?.brandingConfig?.attributes?.brandingSettingCodes?.iconThemes ?? ""
      };
      return messages;
    },
    constructor: function AppHeaderView(options) {
      Marionette.LayoutView.call(this, options);
      this.brandingConfig = this.options.brandingConfig;
      this.readyToRender = false;
      this.enableHamburger = this.options.enableHamburger ?? false;
      SmartGlobalMessage?.setProgresspanelMessageRegionView(this, {
        classes: "csui-global-message",
        enableMinimiseButtonOnProgressPanel: config.enableMinimiseButtonOnProgressPanel
      });
      this.listenTo(this?.brandingConfig, "change:branding", _.bind(function() {
        this.readyToRender = true;
        this.render();
      }, this));
      this._setSkipLinks();
    },
    _setSkipLinks: function() {
      this.hasSkipLinks = false;
      let skipLinksArray = this.options?.skipLinks ?? [];
      if (skipLinksArray.length) {
        this.hasSkipLinks = true;
      }
    },
    onRender: function() {
      if (this.readyToRender) {
        if (this.enableHamburger) {
          this.ui.burgerMenu.removeClass("binf-hidden");
          let region = new Marionette.Region({
            el: this.ui.burgerMenu
          });
          this.smartPanelView = new SmartPanelView(_.extend({
            originatingView: this,
            otcEl: this.ui.burgerMenuBtn
          }, this.options));
          region.show(this.smartPanelView);
        }
        if (this?.hasSkipLinks) {
          this.ui.skipLinks.removeClass("binf-hidden");
          this.skipLinksCollectionView = new SkipLinksCollectionView({
            skipLinks: this.options?.skipLinks
          });
          var skipLinksRegion = this.addRegion(_.uniqueId("smart-skip-links-in-header"), {
            selector: this.ui.skipLinks,
            replaceElement: false
          });
          skipLinksRegion.show(this.skipLinksCollectionView);
        } else {
          this.ui.skipLinks.addClass("binf-hidden");
        }
        let self = this, index = 0, createControls = async function(target, control) {
          ++index;
          if (control?.get("slot") === "leftToolbar") {
            target = this.ui.right;
          }
          let controlUid = control.get("id").replaceAll("/", "_") + "_" + index;
          var View = control.get("view");
          if (View) {
            let controlType = control.get("type");
            let icon = control.get("otcIcon") ?? "";
            let tagName = SCHEMA_ASSOSIATIONS[controlType]?.tagName ?? "otc-toolbaritem";
            let el = await document.createElement(tagName);
            $(el).appendTo(target);
            if (controlType === "badge" || controlType === "button" || controlType === "default" || controlType === "search" || controlType === "progress") {
              control.attributes.aside = true;
            }
            if (control.get("aside") !== undefined && control.get("aside")) {
              let badgeView, searchboxView;
              if (controlType === "badge") {
                var badgeIdVal = controlUid + "_control", badgeViewOptions = _.extend({
                  context: this.options.context,
                  otcEl: el,
                  parentView: self,
                  type: controlType,
                  icon: icon,
                  SCHEMA_ASSOSIATIONS: SCHEMA_ASSOSIATIONS,
                  id: badgeIdVal
                }, {});
                badgeViewOptions.target = target;
                badgeViewOptions.leadingView = View;
                let viewInstance = View;
                viewInstance = BadgeView;
                viewInstance.prototype.behaviors = viewInstance.prototype.behaviors || {};
                viewInstance.prototype.behaviors.SmartAppHeaderControlBehavior = {
                  behaviorClass: SmartAppHeaderControlBehavior
                };
                badgeView = new viewInstance(badgeViewOptions);
                var badgeRegion = self.addRegion(_.uniqueId(controlUid), {
                  selector: el,
                  replaceElement: false
                });
                badgeRegion.show(badgeView);
              } else if (controlType === "search") {
                var searchIdVal = controlUid + "_control", searchViewOptions = _.extend({
                  context: this.options.context,
                  otcEl: el,
                  parentView: self,
                  type: controlType,
                  icon: icon,
                  SCHEMA_ASSOSIATIONS: SCHEMA_ASSOSIATIONS,
                  id: searchIdVal
                }, {});
                searchViewOptions.target = target;
                searchViewOptions.leadingView = View;
                let viewInstance = View;
                viewInstance = SearchBoxView;
                viewInstance.prototype.behaviors = viewInstance.prototype.behaviors || {};
                viewInstance.prototype.behaviors.SmartAppHeaderControlBehavior = {
                  behaviorClass: SmartAppHeaderControlBehavior
                };
                searchboxView = new viewInstance(searchViewOptions);
                var searchRegion = self.addRegion(_.uniqueId(controlUid), {
                  selector: el,
                  replaceElement: false
                });
                searchRegion.show(searchboxView);
              }
              var childTag = document.createElement("div");
              $(childTag).appendTo(this.ui.right);
              var asideRegion = self.addRegion(_.uniqueId(controlUid), {
                selector: childTag,
                replaceElement: true
              }), asideIdVal = controlUid + "_control", asideviewOptions = _.extend({
                context: this.options.context,
                otcEl: el,
                otcElChild: childTag,
                parentView: self,
                type: controlType,
                icon: icon,
                SCHEMA_ASSOSIATIONS: SCHEMA_ASSOSIATIONS,
                id: asideIdVal,
                aside: true,
                child: childTag
              }, {});
              View.prototype.behaviors = View.prototype.behaviors || {};
              View.prototype.behaviors.SmartAppHeaderControlBehavior = {
                behaviorClass: SmartAppHeaderControlBehavior
              };
              let view = new View(asideviewOptions);
              asideRegion.show(view);
              if (controlType === "progress") {
                this.progressView = view;
              }
              badgeView && view.listenTo(view, "data:synced", function() {
                badgeView.otcData = _.extend(badgeView.otcData, view.otcData);
                badgeView.trigger("data:synced");
              });
            } else {
              var region = self.addRegion(_.uniqueId(controlUid), {
                selector: el,
                replaceElement: true
              }), idVal = controlUid + "_control", viewOptions = _.extend({
                context: this.options.context,
                otcEl: el,
                parentView: self,
                type: controlType,
                icon: icon,
                SCHEMA_ASSOSIATIONS: SCHEMA_ASSOSIATIONS,
                id: idVal
              }, {});
              if (controlType === "menu" || controlType === "button-menu") {
                viewOptions.target = this.ui.right;
                viewOptions.leadingView = View;
                View = MenuView;
              }
              View.prototype.behaviors = View.prototype.behaviors || {};
              View.prototype.behaviors.SmartAppHeaderControlBehavior = {
                behaviorClass: SmartAppHeaderControlBehavior
              };
              let view = new View(viewOptions);
              region.show(view);
              if (controlType === "menu") {
                view.$el.find(">*").unwrap();
              }
              if (controlType === "logo") {
                this.logoView = view;
              }
            }
          }
        };
        this._resolveComponents().done(function() {
          controls.rightSide.each(createControls.bind(self, self.ui.overflow));
          controls.logo.each(createControls.bind(self, self.ui.right));
          self.trigger("render:controls", self);
        });
      }
    },
    _resolveComponents: function() {
      if (this._controlsResolved) {
        return this._controlsResolved;
      }
      function resolveControl(name) {
        return new Promise((resolve, reject) => {
          require([ name ], resolve, reject);
        });
      }
      var allComponents = [], promises = [];
      controls.rightSide.models.forEach(model => {
        allComponents.push(model);
      });
      allComponents.push(controls.logo.models[0]);
      allComponents.map(function(control) {
        if (control !== undefined) {
          promises.push(resolveControl(control.id));
        }
      });
      let deferred = $.Deferred();
      if (allComponents.length) {
        Promise.all(promises).then(views => {
          views.forEach(function(view, index) {
            allComponents[index].set("view", view);
          });
          deferred.resolve();
        });
      } else {
        deferred.resolve();
      }
      this._controlsResolved = deferred.promise();
      return this._controlsResolved;
    }
  });
  return AppHeaderView;
});