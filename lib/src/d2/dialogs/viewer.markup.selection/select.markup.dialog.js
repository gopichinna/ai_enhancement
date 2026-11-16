/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/url", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/progressblocker/blocker", "dctmw/utils/rest.resources", "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/viewer.markup.selection/markup.list.view", "d2/utils/format.utils", "i18n!d2/dialogs/viewer.markup.selection/impl/nls/lang" ], function(require, $, _, Backbone, Marionette, Url, PerfectScrollingBehavior, BlockingView, RestResources, StepperWizard, MarkupListView, FormatUtils, lang) {
  "use strict";
  var SelectMarkupDialog = Marionette.Object.extend({
    initialize: function(options) {
      this.options = options;
    },
    show: function() {
      var me = this, deferred = $.Deferred();
      this._steps = this._createWizardSteps();
      this.getMarkupData(this.getDocIdsFromNode(this.options.nodes)).done(function(markupData) {
        me.markupCollection = me.getCollectionFromData(markupData);
        if (me.markupCollection.length > 0) {
          me._wizard = new StepperWizard({
            className: "d2-select-markup",
            steps: me._steps,
            data: {
              markupData: markupData,
              collection: me.markupCollection
            },
            behaviors: _.extend(StepperWizard.prototype.behaviors, {
              PerfectScrolling: {
                behaviorClass: PerfectScrollingBehavior,
                contentParent: ".binf-modal-body",
                suppressScrollX: true
              }
            })
          });
          me.listenTo(me._wizard, "dom:refresh", function() {
            me.trigger("dom:refresh");
          });
          me._wizard.show().on("wizard:closed", function(isCancel) {
            if (isCancel) {
              deferred.reject();
            } else {
              var selectedMarkup = me.getSelectedMarkup();
              deferred.resolve(selectedMarkup);
            }
          });
        } else {
          deferred.resolve({});
        }
      });
      return deferred.promise();
    },
    getSelectedMarkup: function() {
      var selectedMarkup = {};
      _.each(this.markupCollection.models, function(model) {
        var docId = model.get("docId");
        selectedMarkup[docId] = [];
        _.each(model.childrenCollection.models, function(childModel) {
          if (childModel.get("checked") === "true") {
            selectedMarkup[docId].push(childModel.get("markupObjId"));
          }
        });
      });
      return selectedMarkup;
    },
    _createWizardSteps: function() {
      var me = this, step1 = {
        id: "markup",
        title: lang.WizardTitle,
        subTitle: function() {
          return "";
        },
        viewClass: MarkupListView,
        viewOptions: this.options,
        buttons: [ {
          id: "next",
          toolTip: lang.ButtonSelectMarkup,
          label: lang.ButtonSelectMarkup,
          disabled: function() {
            return false;
          },
          clickHandler: function() {
            me._wizard.close();
          }
        } ]
      };
      var steparr = [];
      steparr.push(step1);
      return steparr;
    },
    getDocIdsFromNode: function(nodes) {
      var docIds = [];
      nodes.each(function(node) {
        docIds.push(node.get("id"));
      });
      return docIds;
    },
    getCollectionFromData: function(data) {
      var me = this;
      var collection = new Backbone.Collection(data);
      _.each(collection.models, function(model) {
        var child = _.clone(model.get("markupMetaData"));
        model.unset("markupMetaData");
        model.childrenCollection = new Backbone.Collection(child);
        _.each(model.childrenCollection.models, function(childModel) {
          if (me.options.selectedMarkup && me.options.selectedMarkup[model.get("docId")] && _.contains(me.options.selectedMarkup[model.get("docId")], childModel.get("markupObjId"))) {
            childModel.set("checked", "true");
          }
        });
      });
      return collection;
    },
    getMarkupData: function(docIds) {
      var me = this, deferred = $.Deferred();
      this._blockActions();
      this.fetchData(docIds).done(function(data) {
        var parseData = JSON.parse(data);
        var filterData = _.filter(parseData, function(pData) {
          return pData.markupMetaData.length !== 0;
        });
        deferred.resolve(filterData);
      }).always(function() {
        me._unblockActions();
      });
      return deferred.promise();
    },
    fetchData: function(docIds) {
      var currentRepo = RestResources.getCurrentRepository().get("name"), tzoffset = FormatUtils.getTimezoneOffset(), url = Url.combine(this.options.connector.connection.url, "repositories", currentRepo, "bravaenterprise", "markup", "detail");
      url = Url.appendQuery(url, Url.makeMultivalueParameter("docid", docIds));
      var qParams = {
        tzoffset: tzoffset
      };
      return $.ajax(this.options.connector.extendAjaxOptions({
        url: url,
        method: "GET",
        data: qParams
      }));
    },
    _blockActions: function() {
      $("div.load-container.csui-global").removeClass("binf-hidden");
    },
    _unblockActions: function() {
      $("div.load-container.csui-global").addClass("binf-hidden");
    }
  });
  return SelectMarkupDialog;
});