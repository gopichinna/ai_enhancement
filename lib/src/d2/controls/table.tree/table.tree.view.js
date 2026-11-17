/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/controls/table/table.view", "css!d2/controls/table.tree/impl/table.tree" ], function($, _, Backbone, TableView) {
  "use strict";
  return TableView.extend({
    constructor: function TableTreeView() {
      this.expandedNodes = [];
      this.isTreeMode = true;
      TableView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.collection, "toggle:children", this._toggleChildren);
    },
    _renderTable: function() {
      TableView.prototype._renderTable.apply(this, arguments);
      this.table.on("draw", this.applyIntendations.bind(this));
    },
    _getColumns: function() {
      this.columns.models.unshift(new Backbone.Model({
        column_key: "d2_toggle_children",
        name: "",
        sortable: false,
        alignment: "center",
        permanentColumn: true,
        title: "",
        noTitleInHeader: true,
        definitions_order: 1,
        type: -1
      }));
      TableView.prototype._getColumns.apply(this, arguments);
    },
    onBeforeRender: function() {
      if (!this.reloading) {
        _.each(this.collection.models, function(model) {
          if (_.contains(this.expandedNodes, model.get("id"))) {
            model.set("childExpanded", true, {
              silent: true
            });
          } else {
            model.set("childExpanded", false, {
              silent: true
            });
          }
        }.bind(this));
      }
      TableView.prototype.onBeforeRender.apply(this, arguments);
    },
    _toggleChildren: function(cellView, model) {
      if (cellView.options.childExpanded) {
        this.expandNodes([ model ]);
      } else {
        this.collapseNode(model);
        this._drawTable();
      }
    },
    updateNodeLevel: function(parentNode, childNodes) {
      var parentLevel = parentNode.get("nodeLevel") || 0;
      _.each(childNodes, function(childNode) {
        childNode.set("nodeLevel", parentLevel + 1, {
          silent: true
        });
      }.bind(this));
    },
    applyIntendations: function() {
      _.each(this.collection.models, function(model) {
        var $row = $(this.table.row(_.indexOf(this.collection.models, model)).node()), intend = model.get("nodeLevel") ? model.get("nodeLevel") * 35 : 0;
        if (model.get("childExpanded")) {
          $row.addClass("is-parent-expanded");
        }
        if (intend) {
          $row.addClass("is-child");
          var expandColumn = $row.find("td:nth-child(1)"), thirdColumn = $row.find("td:nth-child(3)");
          expandColumn.css("width", parseInt(expandColumn.css("width")) + intend);
          expandColumn.children().css("padding-left", parseInt(expandColumn.children().css("padding-left")) + intend);
          parseInt(thirdColumn.css("min-width")) > parseInt(thirdColumn.css("width")) - intend && thirdColumn.css("min-width", parseInt(thirdColumn.css("width")) - intend);
          parseInt(thirdColumn.css("max-width")) > parseInt(thirdColumn.css("width")) - intend && thirdColumn.css("max-width", parseInt(thirdColumn.css("width")) - intend);
          thirdColumn.css("width", parseInt(thirdColumn.css("width")) - intend);
        }
      }.bind(this));
    },
    expandNodes: function(models, options) {
      options = options || {};
      var promises = [], deferred = $.Deferred();
      _.each(models, function(model) {
        !_.contains(this.expandedNodes, model.get("id")) && this.expandedNodes.push(model.get("id"));
        model.trigger("d2:tree:expanding:nodes");
        model.set("expandingNodes", true, {
          silent: true
        });
        if (options.refetch) {
          this.collapseNode(model, {
            rememberExpanded: true
          });
          promises.push(model.treeChildNodes.fetch({
            reload: true,
            reset: true
          }));
        } else {
          promises.push(model.treeChildNodes.ensureFetched({
            reload: true,
            reset: true
          }));
        }
        _.last(promises).always(function() {
          model.set({
            childExpanded: true,
            expandingNodes: false
          }, {
            silent: true
          });
          if (model.treeChildNodes.length) {
            model.treeChildNodes.off("toggle:children", this._toggleChildren, this);
            model.treeChildNodes.off("change", this.updateRow, this);
            this.listenTo(model.treeChildNodes, "toggle:children", this._toggleChildren);
            this.listenTo(model.treeChildNodes, "change", this.updateRow);
            this.collection.models.splice.apply(this.collection.models, [ _.indexOf(this.collection.models, model) + 1, 0 ].concat(model.treeChildNodes.models));
            this.updateNodeLevel(model, model.treeChildNodes.models);
            if (!options.reset) {
              if (options.reload || options.refetch) {
                this._drawTableLimited();
              } else {
                this._drawTable();
              }
            }
          } else {
            model.hasTreeChildNodes = false;
            model.trigger("d2:remove:toggler");
          }
        }.bind(this));
      }.bind(this));
      $.whenAll.apply($, promises).always(deferred.resolve);
      return deferred.promise();
    },
    collapseNode: function(model, options) {
      options = options || {};
      if (model.hasTreeChildNodes) {
        _.each(model.treeChildNodes.models, function(treeChildNode) {
          this.collapseNode(treeChildNode, options);
        }.bind(this));
        if (model.get("childExpanded")) {
          if (!options.rememberExpanded) {
            this.expandedNodes = _.without(this.expandedNodes, model.get("id"));
          }
          model.set("childExpanded", false, {
            silent: true
          });
          this.collection.models.splice(_.indexOf(this.collection.models, model) + 1, model.treeChildNodes.length);
        }
      }
    },
    expandInitialNodes: function(options) {
      var nonExpandedNodes = _.filter(this.collection.models, function(model) {
        return _.contains(this.expandedNodes, model.get("id")) && !model.get("childExpanded");
      }.bind(this)), deferred = $.Deferred();
      if (nonExpandedNodes.length) {
        this.expandNodes(nonExpandedNodes, options).done(function() {
          this.expandInitialNodes(options).done(deferred.resolve);
        }.bind(this));
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    resetExpandAttribute: function(models) {
      _.each(models, function(model) {
        if (model.hasTreeChildNodes) {
          this.resetExpandAttribute(model.treeChildNodes.models);
        }
        model.unset("childExpanded", {
          silent: true
        });
      }.bind(this));
    },
    _handleModelsReset: function(collection, options) {
      this.resetExpandAttribute(this.collection.models);
      if (options.reload) {
        this.reloading = true;
        TableView.prototype._handleModelsReset.apply(this, arguments);
        this.reloading = false;
      }
      this.expandInitialNodes({
        reload: options.reload,
        reset: !options.reload
      }).done(function() {
        if (!options.reload) {
          TableView.prototype._handleModelsReset.apply(this, arguments);
        }
      }.bind(this));
    },
    _handleColumnsReset: function() {
      TableView.prototype._handleColumnsReset.apply(this, arguments);
      this.applyIntendations();
    },
    _drawTableLimited: _.debounce(function() {
      this.reloading = true;
      this._drawTable();
      this.reloading = false;
    }, 100),
    updateRow: function(model) {
      this.table.on("draw", {
        model: model,
        view: this
      }, this.refreshTree);
      TableView.prototype.updateRow.apply(this, arguments);
      this.table.off("draw", this.refreshTree);
    },
    getRootNode: function(model) {
      while (model.parentTreeNode) {
        model = model.parentTreeNode;
      }
      return model;
    },
    reloadTreeStructure: function(models) {
      models = _.isArray(models) ? models : [ models ];
      var deferred = $.Deferred(), me = this;
      if (models.length) {
        me.expandNodes(models, {
          refetch: true
        }).done(function() {
          var allModels = [];
          _.each(models, function(model) {
            allModels = allModels.concat(_.filter(model.treeChildNodes.models, function(childModel) {
              return _.contains(me.expandedNodes, childModel.get("id"));
            }));
          });
          me.reloadTreeStructure(allModels).done(deferred.resolve);
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    refreshTree: function(event) {
      var model = event.data.model, me = event.data.view;
      if (!model.updating) {
        model.updating = true;
        if (model.get("childExpanded") || model.get("nodeLevel")) {
          var parentModel = me.getRootNode(model);
          me.reloadTreeStructure(parentModel).done(function() {
            model.updating = false;
            if (model.updateRequestCount) {
              model.updateRequestCount = 0;
              me.refreshTree({
                data: {
                  model: model,
                  view: me
                }
              });
            }
          });
        }
      } else {
        model.updateRequestCount = model.updateRequestCount ? model.updateRequestCount + 1 : 1;
      }
    }
  });
});