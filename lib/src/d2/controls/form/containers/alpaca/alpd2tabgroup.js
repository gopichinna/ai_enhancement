/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/pub.sub", "nuc/utils/base", "i18n!d2/controls/form/impl/nls/lang", "css!d2/controls/form/impl/d2tabgroup/tabgroupcontainer.css", "txt!d2/controls/form/impl/d2tabgroup/tabgroupcontainer.txt", "txt!d2/controls/form/impl/d2tabgroup/tabgroupcontaineritem.txt", "d2/controls/form/containers/alpaca/alpd2container" ], function(_, $, Backbone, Marionette, Alpaca, PubSub, base, lang, d2tabgroupcss, d2tabgroupcontainer, d2tabgroupcontaineritem, alpd2container) {
  "use strict";
  var tabGroupFieldName = "d2tabgroup";
  var tabFieldName = "d2tab";
  var activeTabCSSClass = "binf-active";
  var activeTabCSSClassSelector = ">.d2tabgroupheader " + "." + activeTabCSSClass;
  var tabGroupLinkSelector = ">.d2tabgroupheader .d2tabgroupalink";
  Alpaca.Fields.D2TabGroupField = alpd2container.extend({
    constructor: function D2TabGroupField(container, data, options, schema, view, connector, onError) {
      this.eventArray = [];
      this.base(container, data, options, schema, view, connector, onError);
      options["indent"] = options["tabLevel"] ? 9 : 12;
      var formView = connector.config.formView;
      var formModel = formView.model;
      this.focusedTabId = formModel.focusedTabs ? formModel.focusedTabs[options.uniqueId] : undefined;
    },
    templateHelpers: function() {
      return {
        required_tooltip: lang.requiredField
      };
    },
    getFieldType: function() {
      return tabGroupFieldName;
    },
    getCurrentlyActiveTabId: function() {
      var activeTabLink = this.getContainerEl().find(activeTabCSSClassSelector).first();
      return this.options.layoutMode === "singleCol" ? false : activeTabLink.children().length > 0 && activeTabLink.children().attr("href").substring(1);
    },
    postRender: function(callback) {
      this.base(callback);
      var tabGroup = this;
      var tabGroupContainerEl = tabGroup.getContainerEl();
      var firstVisibleTab;
      if (tabGroup.options.layoutMode !== "singleCol" && tabGroup.focusedTabId) {
        var tab = tabGroup.childrenByPropertyId[tabGroup.focusedTabId];
        if (tab && !tab.options.hidden) {
          firstVisibleTab = tab;
          var firstTabLink = tabGroupContainerEl.find("#d2tabgroupli_" + tab.propertyId);
          firstTabLink.addClass(activeTabCSSClass);
          tab.activate({
            animate: false
          });
        }
      }
      _.each(this.children, function(tab) {
        var tabLink = tabGroupContainerEl.find("#d2tabgroupli_" + tab.propertyId);
        if (tab.options.hidden) {
          tab.deactivate({
            animate: false
          });
          tabLink.hide();
        } else if (_.isUndefined(firstVisibleTab) && tabGroup.options.layoutMode !== "singleCol") {
          firstVisibleTab = tab;
          var firstTabLink = tabGroupContainerEl.find("#d2tabgroupli_" + tab.propertyId);
          firstTabLink.addClass(activeTabCSSClass);
          firstVisibleTab.activate({
            animate: false
          });
        } else if (!firstVisibleTab || firstVisibleTab && tab.propertyId !== firstVisibleTab.propertyId) {
          tab.deactivate({
            animate: false
          });
        }
        var headerLabel = tabLink.find(".category_required");
        tab.options.required === true ? headerLabel.show() : headerLabel.hide();
        if (!tab.options.hidden && tab.options.required === true && !tabGroup.options.required) {
          tabGroup.options.required = true;
        }
      });
      _.each(tabGroup.childrenByPropertyId, function(tab, tabId) {
        var event = [ tabFieldName, tabId, "show" ].join(":");
        tabGroup.eventArray.push(event);
        PubSub.on(event, function(tabId) {
          if (tabGroup.childrenByPropertyId[tabId]) {
            var tabLink = tabGroupContainerEl.find("#d2tabgroupli_" + tabId);
            tabLink.show();
            if (!tabGroup.getCurrentlyActiveTabId() && tabGroup.options.layoutMode !== "singleCol") {
              tabLink.addClass(activeTabCSSClass);
              tabGroup.childrenByPropertyId[tabId].activate({
                animate: false
              });
            }
          }
        });
        var getFirstVisibleTabLink = function(tabLink) {
          var firstLink = tabLink.parent().children().first();
          while (firstLink.length) {
            var cid = firstLink.children().attr("href").substring(1);
            if (!tabGroup.childrenByPropertyId[cid].schema.hidden) {
              return firstLink;
            }
            firstLink = firstLink.next();
          }
          return undefined;
        };
        event = [ tabFieldName, tabId, "hide" ].join(":");
        tabGroup.eventArray.push(event);
        PubSub.on(event, function(tabId) {
          var containingTab = tabGroup.childrenByPropertyId[tabId];
          if (containingTab) {
            var tabLink = tabGroupContainerEl.find("#d2tabgroupli_" + tabId);
            tabLink.hide();
            if (tabLink.hasClass(activeTabCSSClass) && tabGroup.options.layoutMode !== "singleCol") {
              tabLink.removeClass(activeTabCSSClass);
              var firstVisibleTabLink = getFirstVisibleTabLink(tabLink, tabId);
              if (firstVisibleTabLink && firstVisibleTabLink.length) {
                firstVisibleTabLink.addClass(activeTabCSSClass);
                tabGroup.childrenByPropertyId[firstVisibleTabLink.children().attr("href").substring(1)].activate({
                  animate: false
                });
              }
            }
          }
        });
        event = [ tabFieldName, tabId, "active" ].join(":");
        tabGroup.eventArray.push(event);
        PubSub.on(event, function(tabId) {
          var containingTab = tabGroup.childrenByPropertyId[tabId];
          var currentActive = tabGroup.getCurrentlyActiveTabId();
          if (tabId !== currentActive && containingTab) {
            var currentActiveTab = tabGroup.childrenByPropertyId[currentActive];
            currentActiveTab.deactivate({
              animate: false
            });
            if (tabGroup.options.layoutMode !== "singleCol") {
              tabGroupContainerEl.find("#d2tabgroupli_" + currentActive).removeClass(activeTabCSSClass);
              var tabLink = tabGroupContainerEl.find("#d2tabgroupli_" + tabId);
              tabLink.addClass(activeTabCSSClass);
            }
          }
        });
        event = [ tabFieldName, tabId, "required" ].join(":");
        tabGroup.eventArray.push(event);
        PubSub.on(event, function(tabId) {
          if (tabGroup.childrenByPropertyId[tabId]) {
            var tabLink = tabGroupContainerEl.find("#d2tabgroupli_" + tabId);
            var headerLabel = tabLink.find(".category_required");
            headerLabel.show();
          }
          if (tabGroup.options.required !== true) {
            tabGroup.options.required = true;
            PubSub.trigger("required:" + tabGroup.id, tabGroup);
          }
        });
        event = [ tabFieldName, tabId, "optional" ].join(":");
        tabGroup.eventArray.push(event);
        PubSub.on(event, function(tabId) {
          if (tabGroup.childrenByPropertyId[tabId]) {
            var tabLink = tabGroupContainerEl.find("#d2tabgroupli_" + tabId);
            var headerLabel = tabLink.find(".category_required");
            headerLabel.hide();
          }
          var req = tabGroup.options.required;
          tabGroup.options.required = false;
          _.each(tabGroup.children, function(tab) {
            if (tab.options.required === true && !tab.options.hidden) {
              tabGroup.options.required = true;
            }
          });
          if (req !== tabGroup.options.required) {
            var eventPrefix = tabGroup.options.required === true ? "required:" : "optional:";
            PubSub.trigger(eventPrefix + tabGroup.id, tabGroup);
          }
        });
      });
      tabGroupContainerEl.find(tabGroupLinkSelector).on("click", function(event) {
        var tabId = event.target.getAttribute("href").substring(1);
        var activeTabId = tabGroup.getCurrentlyActiveTabId();
        if (activeTabId) {
          tabGroup.childrenByPropertyId[activeTabId].deactivate({
            animate: false
          });
        }
        tabGroup.childrenByPropertyId[tabId] && tabGroup.childrenByPropertyId[tabId].activate({
          animate: true
        });
      });
      if (tabGroup.options.layoutMode !== "singleCol") {
        tabGroupContainerEl.find(tabGroupLinkSelector).on("keydown", _.bind(this._keyDownDefaultEvent, this));
      } else {
        tabGroupContainerEl.find(tabGroupLinkSelector).on("keydown", _.bind(this._keyDownSingleColEvent, this));
      }
    },
    _keyDownSingleColEvent: function(event) {
      var tabGroup = this;
      var handled = false;
      var tabId = $(event.currentTarget).attr("href").substring(1);
      if (event.keyCode !== $.ui.keyCode.ENTER && event.keyCode !== $.ui.keyCode.SPACE) {
        return;
      }
      switch (event.keyCode) {
       case $.ui.keyCode.ENTER:
       case $.ui.keyCode.SPACE:
        var activeTabId = tabGroup.getCurrentlyActiveTabId();
        if (activeTabId) {
          tabGroup.childrenByPropertyId[activeTabId].deactivate({
            animate: false
          });
        }
        tabId = $(event.target).attr("href").substring(1);
        var tab = tabGroup.childrenByPropertyId[tabId];
        tab && tab.activate({
          animate: true
        });
        handled = true;
        break;
      }
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    _keyDownDefaultEvent: function(event) {
      var tabGroup = this;
      var handled = false;
      var tabId = $(event.currentTarget).attr("href").substring(1);
      if (event.keyCode !== $.ui.keyCode.TAB && event.keyCode !== $.ui.keyCode.RIGHT && event.keyCode !== $.ui.keyCode.LEFT && event.keyCode !== $.ui.keyCode.DOWN && event.keyCode !== $.ui.keyCode.ENTER && event.keyCode !== $.ui.keyCode.SPACE) {
        return;
      }
      switch (event.keyCode) {
       case $.ui.keyCode.TAB:
        if (event.shiftKey) {
          break;
        } else {
          PubSub.trigger([ tabFieldName, tabGroup.getCurrentlyActiveTabId(), "focus" ].join(":"), tabId);
          handled = true;
        }
        break;

       case $.ui.keyCode.RIGHT:
        $(event.target).parent().next().children("a").trigger("focus");
        handled = true;
        break;

       case $.ui.keyCode.LEFT:
        $(event.target).parent().prev().children("a").trigger("focus");
        handled = true;
        break;

       case $.ui.keyCode.DOWN:
        PubSub.trigger([ tabFieldName, tabGroup.getCurrentlyActiveTabId(), "focus" ].join(":"), tabId);
        handled = true;
        break;

       case $.ui.keyCode.ENTER:
       case $.ui.keyCode.SPACE:
        var activeTabId = tabGroup.getCurrentlyActiveTabId();
        if (activeTabId) {
          tabGroup.childrenByPropertyId[activeTabId].deactivate({
            animate: false
          });
        }
        tabId = $(event.target).attr("href").substring(1);
        var tab = tabGroup.childrenByPropertyId[tabId];
        tab && tab.activate({
          animate: true
        });
        handled = true;
        break;
      }
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    destroy: function() {
      _.each(this.eventArray, function(event) {
        PubSub.off(event);
      });
      Alpaca.Fields.ObjectField.prototype.destroy.call(this);
    },
    getType: function() {
      return tabGroupFieldName;
    }
  });
  Alpaca.registerFieldClass(tabGroupFieldName, Alpaca.Fields.D2TabGroupField, "bootstrap-csui");
  Alpaca.registerTemplate("container-" + tabGroupFieldName, d2tabgroupcontainer);
  Alpaca.registerTemplate("container-" + tabGroupFieldName + "-item", d2tabgroupcontaineritem);
  return Alpaca.Fields.D2TabGroupField;
});