/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/facet.utils", "dctmw/utils/utils", "d2/utils/task.utils", "d2/utils/format.utils", "nuc/utils/types/date", "i18n!d2/utils/impl/nls/lang" ], function(_, facetUtils, utils, taskUtils, formatUtils, date, lang) {
  "use strict";
  return {
    createTaskFacets: function(models, columnPreference, hasMoreRecords, hadMoreRecords, categoriesTree) {
      var facets = this.getFacetStructure(columnPreference, categoriesTree);
      var categoriesMap = this.flattenCategoriesTree(categoriesTree);
      if (!hasMoreRecords) {
        _.each(models, function(task) {
          var taskCategory = task.get("task_category_id");
          var task_priority = task.get("d2_task_priority");
          var due = formatUtils.formatDueDate(task.get("d2_task_due_date"), false, false);
          var task_read_status = task.get("is_read");
          var task_acquired_status = task.get("task_state");
          if (_.has(categoriesMap, taskCategory)) {
            ++categoriesMap[taskCategory]["facet-value-count"];
          }
          var priorities = facets.priority["facet-value"];
          var pKey = "priority_" + task_priority;
          if (_.has(priorities, pKey)) {
            ++priorities[pKey]["facet-value-count"];
          }
          if (due && due.overdue === true) {
            var overdues = facets.d2_overdue["facet-value"];
            ++overdues[0]["facet-value-count"];
          }
          var taskStates = facets.task_states["facet-value"];
          if (task_read_status === true) {
            ++taskStates["read"]["facet-value-count"];
          } else {
            ++taskStates["unread"]["facet-value-count"];
          }
          if (_.has(taskStates, task_acquired_status)) {
            ++taskStates[task_acquired_status]["facet-value-count"];
          }
        });
        if (categoriesTree) {
          this.updateCategoryCounts(categoriesTree, !hasMoreRecords);
        }
      }
      var processedFacet = _.map(facets, function(obj) {
        if (!hasMoreRecords) {
          obj["facet-value"] = _.filter(obj["facet-value"], function(topic) {
            return topic["facet-value-count"] > 0;
          });
        }
        return obj;
      });
      var newfacets = facetUtils.parseNewFacets(processedFacet);
      return {
        facetConfig: newfacets,
        categoriesTree: categoriesTree
      };
    },
    updateCategoryCounts: function(facet, removeZeroCountNodes) {
      var me = this;
      if (facet.facets && facet.facets.length > 0) {
        for (var i = facet.facets.length - 1; i >= 0; i--) {
          var child = facet.facets[i];
          var childCount = me.updateCategoryCounts(child, removeZeroCountNodes);
          if (childCount === 0) {
            facet.facets.splice(i, 1);
          }
          facet["facet-value-count"] = (facet["facet-value-count"] ? facet["facet-value-count"] : 0) + childCount;
        }
        return facet["facet-value-count"];
      } else {
        return facet["facet-value-count"];
      }
    },
    getFacetStructure: function(columnPreference, categoriesTree) {
      var dueDateLabel = columnPreference.columns.get("due_date") ? columnPreference.columns.get("due_date").get("label") : lang.overdue, priorityLabel = columnPreference.columns.get("priority") ? columnPreference.columns.get("priority").get("label") : lang.priority;
      var categoryFacetValues = categoriesTree && categoriesTree.facets ? categoriesTree.facets : [];
      var showSearch = _.isObject(_.find(categoryFacetValues, function(cat) {
        if (cat.facets && cat.facets.length > 0) {
          return true;
        }
      }));
      return {
        category: {
          "facet-label": "Category",
          "facet-id": "task_category_id",
          "show-search": showSearch,
          "facet-value": categoryFacetValues
        },
        priority: {
          "facet-label": priorityLabel,
          "facet-id": "d2_task_priority",
          "items-to-show": 6,
          "facet-value": {
            priority_5: {
              "facet-type": "string",
              "facet-value-label": lang.priorityNameHighest,
              "facet-value-id": "priority_5",
              "facet-value": 5,
              "facet-value-count": 0
            },
            priority_4: {
              "facet-type": "string",
              "facet-value-label": lang.priorityNameHigh,
              "facet-value-id": "priority_4",
              "facet-value": 4,
              "facet-value-count": 0
            },
            priority_3: {
              "facet-type": "string",
              "facet-value-label": lang.priorityNameNormal,
              "facet-value-id": "priority_3",
              "facet-value": 3,
              "facet-value-count": 0
            },
            priority_2: {
              "facet-type": "string",
              "facet-value-label": lang.priorityNameLow,
              "facet-value-id": "priority_2",
              "facet-value": 2,
              "facet-value-count": 0
            },
            priority_1: {
              "facet-type": "string",
              "facet-value-label": lang.priorityNameLowest,
              "facet-value-id": "priority_1",
              "facet-value": 1,
              "facet-value-count": 0
            },
            priority_0: {
              "facet-type": "string",
              "facet-value-label": lang.priorityNameNoPriority,
              "facet-value-id": "priority_0",
              "facet-value": 0,
              "facet-value-count": 0
            }
          }
        },
        d2_overdue: {
          "facet-label": dueDateLabel,
          "facet-id": "d2_overdue",
          "facet-value": [ {
            "facet-type": "string",
            "facet-value-label": lang.taskOverdue,
            "facet-value-id": "d2_overdue",
            "facet-value": true,
            "facet-value-count": 0
          } ]
        },
        sent_date: {
          "facet-label": lang.sentDate,
          "facet-id": "sent_date",
          "facet-bar-item-view": "date_bar_item_view",
          "facet-value": {
            from_date: {
              "facet-type": "date",
              "facet-value-label": lang.sentDateFrom,
              "facet-value-id": "from_date",
              "facet-value": "",
              "facet-value-count": 1,
              "facet-item-view": "date_item_view",
              "facet-label": lang.sentDateFacetBarFromLabel,
              validator: function() {
                var message = "", status = true;
                if (formatUtils.compareDate(this.getValue(), "$TODAY", ">", true)) {
                  message = _.str.sformat(lang.dateGreaterThanToday, lang.sentDateFrom);
                  status = false;
                  return {
                    status: status,
                    message: message
                  };
                }
                var toDateValue = this.options.view.model.collection.get("to_date").get("facet-value");
                if (!_.isEmpty(toDateValue) && formatUtils.compareDate(this.getValue(), toDateValue, ">", true)) {
                  message = lang.fromDateLessThanTo;
                  status = false;
                  return {
                    status: status,
                    message: message
                  };
                }
                return {
                  status: status,
                  message: message
                };
              }
            },
            to_date: {
              "facet-type": "date",
              "facet-value-label": lang.sentDateTo,
              "facet-value-id": "to_date",
              "facet-value": "",
              "facet-value-count": 1,
              "show-facet-value": true,
              "facet-item-view": "date_item_view",
              "facet-label": lang.sentDateFacetBarToLabel,
              validator: function() {
                var message = "", status = true;
                if (formatUtils.compareDate(this.getValue(), "$TODAY", ">", true)) {
                  message = _.str.sformat(lang.dateGreaterThanToday, lang.sentDateTo);
                  status = false;
                  return {
                    status: status,
                    message: message
                  };
                }
                var fromDateValue = this.options.view.model.collection.get("from_date").get("facet-value");
                if (!_.isEmpty(fromDateValue) && formatUtils.compareDate(this.getValue(), fromDateValue, "<", true)) {
                  message = lang.toDateGreaterThanFrom;
                  status = false;
                  return {
                    status: status,
                    message: message
                  };
                }
                return {
                  status: status,
                  message: message
                };
              }
            }
          }
        },
        task_states: {
          "facet-label": lang.taskStates,
          "facet-id": "task_states",
          "fixed-position": true,
          "facet-value": {
            read: {
              "facet-type": "string",
              "facet-value-label": lang.taskRead,
              "facet-value-id": "is_read_true",
              "facet-value": true,
              "facet-value-count": 0
            },
            unread: {
              "facet-type": "string",
              "facet-value-label": lang.taskUnread,
              "facet-value-id": "is_read_false",
              "facet-value": false,
              "facet-value-count": 0
            },
            acquired: {
              "facet-type": "string",
              "facet-value-label": lang.taskAcquired,
              "facet-value-id": "acquired",
              "facet-value": "acquired",
              "facet-value-count": 0
            }
          }
        }
      };
    },
    createServerFilters: function(facetFilters, categoriesTree) {
      var filters = {
        facetFilters: [],
        categoryFilters: []
      };
      _.each(facetFilters, function(facetCategory) {
        var propertyName = facetCategory.id;
        var filter;
        if (propertyName === "d2_task_priority") {
          _.each(facetCategory.values, function(facet) {
            if (filter) {
              filter = filter + " or ";
            } else {
              filter = "";
            }
            filter = filter + "priority=" + facet.facetvalue;
          });
          filters.facetFilters.push(filter);
        } else if (propertyName === "task_states") {
          var filterReadTasks = _.find(facetCategory.values, function(item) {
            return item.id === "is_read_true";
          });
          var filterUnreadTasks = _.find(facetCategory.values, function(item) {
            return item.id === "is_read_false";
          });
          var filterAcquiredTasks = _.find(facetCategory.values, function(item) {
            return item.id === "acquired";
          });
          if (filterReadTasks) {
            filter = "instruction_page=1";
          }
          if (filterUnreadTasks) {
            if (filter) {
              filter = filter + " or ";
            } else {
              filter = "";
            }
            filter = filter + "instruction_page=0";
          }
          if (filterAcquiredTasks) {
            if (filter) {
              filter = filter + " or ";
            } else {
              filter = "";
            }
            filter = filter + " task_state='acquired'";
          }
          filters.facetFilters.push(filter);
        } else if (propertyName === "d2_overdue") {
          var now = formatUtils.getNowValue();
          filters.facetFilters.push('due_date <= date("' + now + '")');
        } else if (propertyName === "sent_date") {
          _.each(facetCategory.values, function(facet) {
            if (facet.id === "from_date") {
              var local_from_date = formatUtils.convertToMoment(facet.facetvalue);
              var from_date = date.formatISODate(local_from_date);
              filters.facetFilters.push('date_sent >= date("' + from_date + '")');
            } else {
              var local_to_date = formatUtils.convertToMoment(facet.facetvalue);
              local_to_date.hour(23).minute(59).second(59);
              var to_date = date.formatISODate(local_to_date);
              filters.facetFilters.push('date_sent <= date("' + to_date + '")');
            }
          });
        } else if (propertyName === "task_category_id") {
          if (categoriesTree) {
            var categoriesMap = this.flattenCategoriesTree(categoriesTree);
            var results = this.calculateCategoriestoBefiltered(facetCategory, categoriesMap);
            _.each(results, function(id) {
              filters.categoryFilters.push(id);
            });
          }
        }
      }, this);
      return filters;
    },
    flattenCategoriesTree: function(treeRoot, map) {
      if (_.isUndefined(map)) {
        map = {};
      }
      if (treeRoot && treeRoot.facets && treeRoot.facets.length > 0) {
        _.each(treeRoot.facets, function(node) {
          map[node["facet-value-id"]] = node;
          this.flattenCategoriesTree(node, map);
        }, this);
      }
      return map;
    },
    buildCategoriesTree: function(categories) {
      var categoryMap = {};
      categories.forEach(function(category) {
        var categoryParentId = category.content.properties.i_folder_id[0];
        var categoryId = category.content.properties.r_object_id;
        var categoryFacetObj = {
          "facet-type": "string",
          "facet-value-label": category.content.properties.object_name,
          "facet-value-id": categoryId,
          "facet-value": categoryId,
          "facet-value-count": 0
        };
        if (!_.isUndefined(categoryMap[categoryId]) && !_.isUndefined(categoryMap[categoryId].facets)) {
          categoryFacetObj.facets = categoryMap[categoryId].facets;
        }
        categoryMap[categoryId] = categoryFacetObj;
        categoryMap[categoryParentId] = categoryMap[categoryParentId] || {};
        categoryMap[categoryParentId].facets = categoryMap[categoryParentId].facets || [];
        categoryMap[categoryParentId].facets.push(categoryFacetObj);
      });
      var rootNode = _.find(categoryMap, function(val) {
        if (_.isUndefined(val["facet-value-id"])) {
          val.isRoot = true;
          return true;
        } else {
          return false;
        }
      });
      return _.deepClone(rootNode);
    },
    calculateCategoriestoBefiltered: function(facetCategoryFilter, categoriesMap) {
      var selectedCategoryIds = Object.create(null);
      facetCategoryFilter.values.forEach(function(category) {
        var categoryParentId = category.parentid === "" ? "root" : category.parentid;
        var categoryId = category.id;
        var categoryTreeObj = {
          id: category.facetvalue
        };
        if (!_.isUndefined(selectedCategoryIds[categoryId]) && !_.isUndefined(selectedCategoryIds[categoryId].children)) {
          categoryTreeObj.children = selectedCategoryIds[categoryId].children;
        }
        selectedCategoryIds[categoryId] = categoryTreeObj;
        selectedCategoryIds[categoryParentId] = selectedCategoryIds[categoryParentId] || {};
        selectedCategoryIds[categoryParentId].children = selectedCategoryIds[categoryParentId].children || [];
        selectedCategoryIds[categoryParentId].children.push(categoryTreeObj);
      });
      var leaf = [];
      var findLeaf = function(children) {
        children.forEach(function(child) {
          if (_.isUndefined(child.children)) {
            leaf.push(child.id);
          } else {
            findLeaf(child.children);
          }
        });
      };
      findLeaf(selectedCategoryIds.root.children);
      var idsToMatch = [];
      if (leaf.length > 0) {
        leaf.forEach(function(id) {
          idsToMatch.push(id);
          var selectedLeafNode = categoriesMap[id];
          var addAllChildNode = function(children) {
            if (children) {
              children.forEach(function(child) {
                if (!_.isUndefined(child.facets)) {
                  addAllChildNode(child.facets);
                }
                idsToMatch.push(child["facet-value"]);
              });
            }
          };
          addAllChildNode(selectedLeafNode.facets);
        });
      }
      return idsToMatch;
    }
  };
});