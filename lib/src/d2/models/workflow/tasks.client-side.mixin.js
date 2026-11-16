/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/base", "nuc/models/browsable/client-side.mixin", "csui/models/node.facets/facet.query.mixin", "d2/utils/format.utils", "d2/utils/facet.utils", "d2/models/workflow/tasks.facets.helper" ], function(_, $, Backbone, base, ClientSideMixin, FacetQueryMixin, formatUtils, facetUtils, facetHelper) {
  var D2ClientSideBrowsableMixin = {
    mixin: function(prototype) {
      ClientSideMixin.mixin(prototype);
      FacetQueryMixin.mixin(prototype);
      return _.extend(prototype, {
        _fill: function(options) {
          var filterAndSortCriteria = {
            orderBy: this.orderBy,
            filters: _.clone(this.filters)
          }, models;
          var currentFacetConstraint = this.getFilterQuery(this.taskFacets.filters) || {};
          if (this._lastFilterAndSortCriteria && _.isEqual(this._lastFilterAndSortCriteria, filterAndSortCriteria) && _.isEqual(JSON.stringify(currentFacetConstraint) !== JSON.stringify(this.previousConstraint))) {
            models = this.lastFilteredAndSortedModels;
          } else {
            models = _.clone(this.allModels);
            models = this._filter(models, options);
            this.sorting && !this.sorting.links && (this.sorting = undefined);
            if (!options.skipSort) {
              models = this._sort(models);
              if (this.orderBy && this.sorting === undefined) {
                var orderBy = this.orderBy.split(" ");
                this.sorting = {
                  sort: []
                };
                this.sorting.sort.push({
                  key: "sort",
                  value: (orderBy[1] || "asc") + "_" + orderBy[0]
                });
              }
            }
            this.lastFilteredAndSortedModels = models;
            this._lastFilterAndSortCriteria = filterAndSortCriteria;
          }
          this.totalCount = this.allModels.length;
          this.filteredCount = models.length;
          models = this._limit(models);
          var reset = options.reset;
          if (reset === undefined) {
            reset = this.autoreset;
          }
          var method = reset ? "reset" : "set";
          ++this._filling;
          this[method](models, options);
          --this._filling;
          return models;
        },
        _filter: function(models, options) {
          if (!options.reload || options.reload && !(this.hasMoreRecords || this.hadMoreRecords)) {
            var self = this;
            _.each(this.taskFacets.filters, function(facetCategory) {
              var propertyName = facetCategory.id;
              var matchFunction = function(task) {
                var valuesToMatch = _.pluck(facetCategory.values, "facetvalue");
                return _.contains(valuesToMatch, task.get(propertyName));
              };
              if (propertyName === "task_category_id") {
                var categoriesMap = facetHelper.flattenCategoriesTree(self.categoriesTree);
                var results = facetHelper.calculateCategoriestoBefiltered(facetCategory, categoriesMap);
                matchFunction = function(task) {
                  return _.contains(results, task.get(propertyName));
                };
              }
              if (propertyName === "task_states") {
                var filterReadTasks = _.find(facetCategory.values, function(item) {
                  return item.id === "is_read_true";
                });
                var filterUnreadTasks = _.find(facetCategory.values, function(item) {
                  return item.id === "is_read_false";
                });
                var filterAcquiredTasks = _.find(facetCategory.values, function(item) {
                  return item.id === "acquired";
                });
                matchFunction = function(task) {
                  var stateResult = !filterReadTasks && !filterUnreadTasks;
                  if (filterReadTasks) {
                    stateResult = task.get("is_read") === true;
                  }
                  if (filterUnreadTasks && !stateResult) {
                    stateResult = task.get("is_read") === false;
                  }
                  if (filterAcquiredTasks) {
                    stateResult = stateResult && task.get("task_state") === "acquired";
                  }
                  return stateResult;
                };
              }
              if (propertyName === "d2_overdue") {
                matchFunction = function(task) {
                  var due = formatUtils.formatDueDate(task.get("d2_task_due_date"), false, false) || {};
                  return true === due.overdue;
                };
              }
              if (propertyName === "sent_date") {
                matchFunction = function(task) {
                  var sentDate = task.get("date_sent");
                  var result = true;
                  _.each(facetCategory.values, function(facet) {
                    if (facet.id === "from_date") {
                      result = result && formatUtils.compareDate(sentDate, facet.facetvalue, ">=", true);
                    } else {
                      result = result && formatUtils.compareDate(sentDate, facet.facetvalue, "<=", true);
                    }
                  });
                  return result;
                };
              }
              models = _.filter(models, matchFunction);
            });
            for (var name in this.filters) {
              if (_.has(this.filters, name)) {
                var values = this.filters[name];
                if (values != null && values !== "") {
                  _.isArray(values) || (values = [ values ]);
                  models = _.filter(models, function(node) {
                    var hay = self._parseValue(name, node.get(name));
                    return _.any(values, function(value) {
                      var needle = self._parseValue(name, value);
                      if (name === "type" && needle === -1) {
                        return node.get("container");
                      }
                      return self._containsValue(name, hay, needle);
                    });
                  });
                }
              }
            }
          }
          if (this.expanded) {
            this.applySelectedFilters(models, options);
          }
          this.taskFacets.hasMoreRecords = this.hasMoreRecords;
          this.taskFacets.hadMoreRecords = this.hadMoreRecords;
          return models;
        },
        applySelectedFilters: function(filteredModels, options) {
          var isClientSideForceReload = options.reload && !(this.hasMoreRecords || this.hadMoreRecords);
          var taskFacetsConfigForFilteredModels = facetHelper.createTaskFacets(filteredModels, this.columnPreference, this.hasMoreRecords, this.hadMoreRecords, _.deepClone(this.categoriesTree));
          var taskFacetsForFilteredModels = taskFacetsConfigForFilteredModels.facetConfig;
          var filters = this.taskFacets.filters;
          if (filters.length === 0) {
            this.baseFacets = null;
          }
          if (isClientSideForceReload) {
            var taskFacetsConfig = facetHelper.createTaskFacets(this.allModels, this.columnPreference, this.hasMoreRecords, this.hadMoreRecords, _.deepClone(this.categoriesTree));
            var taskFacets = taskFacetsConfig.facetConfig;
            this.baseFacets = taskFacets;
          }
          var facetArr = facetUtils.computeFacets(_.deepClone(taskFacetsForFilteredModels), this.baseFacets, filters, this.hasMoreRecords, true);
          if (!this.baseFacets) {
            this.baseFacets = taskFacetsForFilteredModels;
          }
          var selectedIds = [];
          if (filters) {
            _.each(filters, function(filter) {
              var values = filter.values;
              _.each(values, function(value) {
                selectedIds.push({
                  "facet-id": filter.id,
                  id: value.id,
                  value: value.facetvalue
                });
              });
            });
          }
          _.each(facetArr, function(facet) {
            _.each(facet.topics, function(topic) {
              var foundValue = _.findWhere(selectedIds, {
                "facet-id": this.id
              }) && _.findWhere(selectedIds, {
                id: topic.id
              });
              if (foundValue) {
                topic["facet-value"] = foundValue.value;
              }
            }, facet);
          }, this);
          this.taskFacets.reset(facetArr);
        }
      });
    }
  };
  return D2ClientSideBrowsableMixin;
});