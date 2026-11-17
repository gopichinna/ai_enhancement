/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/utils/contexts/factories/connector", "dctmw/controls/behaviors/defer.dataload.until.visible.behavior", "d2/controls/query.form/query.form.dialog", "d2/utils/contexts/factories/search.query.form.factory", "d2/widgets/savedsearch/savedsearch.groups.factory", "d2/widgets/shortcut/shortcut.behavior", "i18n!d2/widgets/shortcuts/impl/nls/lang" ], function(_, ConnectorFactory, DeferredDataLoadBehavior, QueryFormDialog, SearchQueryFormModelFactory, SavedSearchGroupFactory, ShortcutBehavior, lang) {
  "use strict";
  var disableClick = false;
  var QueryFormShortcutBehavior = ShortcutBehavior.extend({
    constructor: function QueryFormShortcutBehavior(options) {
      this.behaviors = _.extend(this.behaviors || {}, {
        DeferredDataLoadBehavior: {
          behaviorClass: DeferredDataLoadBehavior,
          containerSelector: ".module-d2-view",
          dataSource: function() {
            return this.savedSearchGroupModel;
          }.bind(this)
        }
      });
      QueryFormShortcutBehavior.__super__.constructor.apply(this, arguments);
      options = options || {};
      this.model = options.context.getModel(SearchQueryFormModelFactory, {
        attributes: {
          shortcutName: options.data.name
        }
      });
      this.model.isFetchable = function() {
        return false;
      };
      this.savedSearchGroupModel = options.context.getModel(SavedSearchGroupFactory, {
        detached: true,
        permanent: true
      });
      this.listenTo(this.savedSearchGroupModel, "sync error", this.view.render.bind(this.view));
    },
    onRender: function() {
      this.viewModel.set("enabled", false);
      if (this.savedSearchGroupModel.fetched) {
        this._updatQueryFormId(this.savedSearchGroupModel.toJSON(), this.options);
      }
    },
    _updatQueryFormId: function(queryFormModel, options) {
      var savedSearchModel = this._getQueryFormModel(queryFormModel, options, "public_search");
      var queryId = "";
      if (savedSearchModel) {
        queryId = savedSearchModel.get("r_object_id");
        this.model.set("links", savedSearchModel.get("links"));
        options.data.title = savedSearchModel.get("name");
        this.viewModel.set("enabled", true);
        if (this.viewModel.get("name") !== savedSearchModel.get("name")) {
          this.viewModel.set("name", savedSearchModel.get("name"));
        }
      } else {
        var title = lang.shortcutQueryIdNotAvailable;
        if (this.model.get("shortcutName")) {
          title = _.str.sformat(lang.shortcutQueryIdNotAvailableWithName, this.model.get("shortcutName"));
        }
        this.viewModel.set("error", {
          message: lang.itemCannotbeAccessed,
          title: title
        });
      }
      this.model.set("id", queryId);
    },
    _getQueryFormModel: function(savedSearchGroupModel, options, savedSearchType) {
      var savedSearchList = [];
      if (savedSearchGroupModel) {
        _.each(savedSearchGroupModel, function(savedSearchGroup) {
          if (savedSearchGroup.savedsearch) {
            _.each(savedSearchGroup.savedsearch, function(savedSearchModel) {
              savedSearchModel.get("r_object_id");
              savedSearchList.push(savedSearchModel);
            });
          }
        });
      }
      return _.find(savedSearchList, function(item) {
        return item.get("r_object_type") === "d2_queryform_config" && item.get("search-category") === savedSearchType && item.get("object_name") === options.data.name;
      });
    },
    onClick: function() {
      if (disableClick === true) {
        return;
      }
      disableClick = true;
      var connector = this.options.context.getObject(ConnectorFactory);
      delete this.options.context.queryform;
      var options = {
        savedSearchName: this.options.data.title,
        savedSearchId: this.model.get("id"),
        context: this.options.context,
        connector: connector,
        links: this.model.get("links")
      };
      var qdialog = new QueryFormDialog(options);
      qdialog.show().finally(function() {
        disableClick = false;
      });
    }
  });
  return QueryFormShortcutBehavior;
});