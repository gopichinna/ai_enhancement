/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/models/nodeversions", "nuc/models/nodes", "csui/utils/contexts/factories/previous.node", "csui/utils/contexts/factories/next.node", "csui/controls/progressblocker/blocker", "d2/utils/node.version.utils", "hbs!d2/widgets/document.overview/form.fields/impl/version.navigator.field", "i18n!d2/widgets/document.overview/form.fields/impl/nls/lang", "css!d2/widgets/document.overview/form.fields/impl/version.navigator.field" ], function(_, $, Backbone, Marionette, NodeVersionCollection, NodeCollection, PreviousNodeModelFactory, NextNodeModelFactory, BlockingView, versionUtil, template, lang) {
  "use strict";
  var VersionNavigatorFieldView = Marionette.ItemView.extend({
    className: "cs-formfield d2-version-selector",
    template: template,
    ui: {
      link: ".link-container a"
    },
    events: {
      "click @ui.link": "onLinkClick",
      "keyup @ui.link": "onLinkKeyUp"
    },
    constructor: function VersionNavigatorFieldView(options) {
      options = options || {};
      options.model = options.model.clone();
      Marionette.ItemView.apply(this, arguments);
      if (options && options.blockingParentView) {
        BlockingView.delegate(this, options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      var context = options.context;
      this.collection = new Backbone.Collection([ this.pickModelAttributes(this.model) ], {
        comparator: "r_version_label"
      });
      this.nextNodeModel = context.getModel(NextNodeModelFactory);
      var previousNodeModel = context.getModel(PreviousNodeModelFactory);
      this.previousNodeId = previousNodeModel && previousNodeModel.get("id");
      this.isDocumentCurrent = versionUtil.isCurrentVersion(this.model);
      if (!this.isDocumentCurrent || options.showOriginalDocumentLink && !!this.previousNodeId) {
        this.versionCollection = new NodeVersionCollection(undefined, {
          node: this.options.model,
          autoreset: true,
          expand: "user",
          ignoreColumns: true,
          onlyClientSideDefinedColumns: true
        });
        this.listenToOnce(this.versionCollection, "sync", this.onVersionRetrievalSuccess);
        this.listenToOnce(this.versionCollection, "error", this.unblockActions);
        this.blockActions();
        this.versionCollection.fetch();
      }
    },
    templateHelpers: function() {
      return {
        items: _.sortBy(this.collection.map(function(model) {
          var tObj = {};
          if (model.get("id") !== this.model.get("id")) {
            tObj.versionLabel = versionUtil.isCurrentVersion(model) ? lang.linkLabelVersionCurrent : _.str.sformat(lang.linkLabelVersionOriginal, model.get("r_version_label"));
            tObj.id = model.get("id");
          } else {
            var labels = model.get("r_version_label");
            if (_.isString(labels)) {
              labels = [ labels ];
            }
            tObj.versionLabel = labels.join(", ");
            tObj.order = 0;
          }
          return tObj;
        }.bind(this)), "order")
      };
    },
    onVersionRetrievalSuccess: function() {
      var filtered = this.versionCollection.filter(function(model) {
        var id = model.get("id");
        return id === this.model.get("id") || (this.isDocumentCurrent ? !!this.previousNodeId && id === this.previousNodeId : versionUtil.isCurrentVersion(model));
      }.bind(this));
      this.collection.reset(_.map(filtered, function(model) {
        return this.pickModelAttributes(model);
      }.bind(this)));
      this.stopListening(this.versionCollection, "error");
      this.listenToOnce(this, "render", this.unblockActions);
      this.render();
    },
    pickModelAttributes: function(model) {
      return _.pick(model.attributes, [ "id", "i_latest_flag", "r_version_label" ]);
    },
    onLinkClick: function(event) {
      event.preventDefault();
      var $el = $(event.currentTarget);
      var versionId = $el.attr("data-id");
      if (versionId) {
        var versionModel = this.versionCollection.findWhere(function(vm) {
          return vm.get("id") === versionId;
        });
        if (versionModel) {
          this.triggerMethod("version:navigate", this.isDocumentCurrent);
          this.nextNodeModel.set({
            id: versionModel.get("id")
          });
        }
      }
    },
    onLinkKeyUp: function(event) {
      if (event.keyCode === 13) {
        this.onLinkClick(event);
      }
    }
  });
  return VersionNavigatorFieldView;
});