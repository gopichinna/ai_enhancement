/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/log" ], function(module, _, Backbone, Marionette, log) {
  "use strict";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        setupKeyboardNavigationMixin(options) {
          options || (options = {});
          this._knMixin = {};
          let optionsArray;
          if (_.isArray(options)) {
            optionsArray = options;
          } else {
            optionsArray = [ options ];
          }
          for (const scopedOptions of optionsArray) {
            let scope;
            const knOptions = _.pick(scopedOptions, "scope", "knViewsCollection", "isTabRegion", "isFocusableElement", "getFocusableElement", "id", "focus", "setTabStop");
            if (scopedOptions.scope) {
              scope = scopedOptions.scope;
            } else {
              scope = "default";
            }
            this._knMixin[scope] = knOptions;
            if (this._knMixin[scope].isTabRegion) {
              this._knMixin[scope].knViewsCollection = new Backbone.Collection();
              this._knMixin[scope].knViewsCollection.knScope = scope;
              if (this._knMixin[scope].knViewsCollection.tabRegionName) {
                throw new Error(`KN-mixin: knViews collection already has tabRegionName set to ${this._knMixin[scope].knViewsCollection.tabRegionName}. Only one view in the knViews collection can be tab-region.`);
              }
              this._knMixin[scope].knViewsCollection.tabRegionName = scopedOptions.tabRegionName;
            } else {
              if (scopedOptions?.knViewsCollection) {
                this._knMixin[scope].knViewsCollection = scopedOptions.knViewsCollection;
              } else {
                if (this.options.knViewsCollection?.knScope === scope) {
                  this._knMixin[scope].knViewsCollection = this.options.knViewsCollection;
                }
              }
            }
            if (!this._knMixin[scope].knViewsCollection) {
              continue;
            }
            this.listenTo(this, "dom:refresh", () => {
              if (this.knIgnoreDomRefresh) {
                return;
              }
              this._addOrRemoveFromKnViewsCollection(scope);
            });
            this.listenTo(this, "kn:ready show", () => {
              this._addOrRemoveFromKnViewsCollection(scope);
            });
            if (this.knIsFocusableElement({
              scope: scope
            })) {
              this.listenTo(this, "destroy kn:remove", () => {
                if (!this._knMixin[scope].knViewsCollection) {
                  return;
                }
                const id = this.knGetIdentifier({
                  scope: scope
                });
                log.debug(`KN: scope ${scope}: removing view with id ${id}`) && console.log(log.last);
                this._knMixin[scope].knViewsCollection.remove(id);
              });
            }
          }
        },
        _scopeFromOptions: function(options) {
          let scope = "default";
          if (options?.scope) {
            scope = options.scope;
          }
          return scope;
        },
        _addOrRemoveFromKnViewsCollection: function(scope) {
          if (this.knIsFocusableElement({
            scope: scope
          })) {
            this._addToKnViewsCollection({
              scope: scope
            });
          } else {
            if (!this._knMixin[scope].isTabRegion) {
              const id = this.knGetIdentifier({
                scope: scope
              });
              log.debug(`KN: scope ${scope}: removing view with id ${id} because it is not focusable`) && console.log(log.last);
              this._knMixin[scope].knViewsCollection.remove(id);
            }
          }
        },
        knIsFocusableElement: function(options) {
          const scope = this._scopeFromOptions(options);
          if (this._knMixin[scope].isFocusableElement === undefined) {
            return false;
          } else {
            if (_.isBoolean(this._knMixin[scope].isFocusableElement)) {
              return this._knMixin[scope].isFocusableElement;
            } else {
              if (_.isFunction(this._knMixin[scope].isFocusableElement)) {
                return this._knMixin[scope].isFocusableElement.call(this, {
                  scope: scope
                });
              } else {
                if (_.isFunction(this[this._knMixin[scope].isFocusableElement])) {
                  return this[this._knMixin[scope].isFocusableElement].call(this, {
                    scope: scope
                  });
                } else {
                  throw new Error(`knView ${this.constructor.name}: scope ${scope}: isFocusableElement from kn-mixin options is not a function and not true/false`);
                }
              }
            }
          }
        },
        knGetKnViewsCollection: function(options) {
          const scope = this._scopeFromOptions(options);
          return this._knMixin[scope].knViewsCollection;
        },
        _knSortByPositions: function(items) {
          let sortedNodes = [];
          let availableNodes = [ ...items ];
          while (availableNodes.length > 0) {
            let minY = Number.MAX_SAFE_INTEGER;
            for (const node of availableNodes) {
              minY = Math.min(minY, node.y);
            }
            const topRow = [];
            const otherRows = [];
            for (const node of availableNodes) {
              if (Math.abs(minY - node.y) <= node.height) {
                topRow.push(node);
              } else {
                otherRows.push(node);
              }
            }
            topRow.sort((a, b) => a.y - b.y);
            topRow.sort((a, b) => a.x - b.x);
            sortedNodes = [ ...sortedNodes, ...topRow ];
            availableNodes = [ ...otherRows ];
          }
          return sortedNodes;
        },
        knGetKnViewsSorted: function(options) {
          const scope = this._scopeFromOptions(options);
          const knViewsInfo = this._knMixin[scope].knViewsCollection.map(knViewInfo => {
            const knView = knViewInfo.get("view");
            const el = knView.knGetFocusableElement({
              scope: scope
            });
            const rect = el.getBoundingClientRect();
            return {
              scope: scope,
              view: knView,
              id: knViewInfo.get("id"),
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            };
          });
          return this._knSortByPositions(knViewsInfo);
        },
        knGetCurrentlyFocusedViewIdentifier: function(options) {
          const scope = this._scopeFromOptions(options);
          if (this._knMixin[scope].knViewsCollection) {
            return this._knMixin[scope].knViewsCollection._currentlyFocusedViewIdentifier;
          }
        },
        knSetCurrentlyFocusedViewIdentifier: function(viewOrId, options) {
          const scope = this._scopeFromOptions(options);
          if (viewOrId) {
            if (_.isString(viewOrId)) {
              this._knMixin[scope].knViewsCollection._currentlyFocusedViewIdentifier = viewOrId;
            } else {
              this._knMixin[scope].knViewsCollection._currentlyFocusedViewIdentifier = viewOrId.knGetIdentifier({
                scope: scope
              });
            }
          } else {
            this._knMixin[scope].knViewsCollection._currentlyFocusedViewIdentifier = undefined;
          }
        },
        knUpdateTabStops: function(knViewsInfos) {
          if (!knViewsInfos) {
            throw new Error(`knView ${this.constructor.name}: knUpdateTabStops called without parameter knViewsInfos`);
          }
          let currentlyFocusedViewInfo;
          knViewsInfos.forEach((knViewInfo, index) => {
            const view = knViewInfo.view;
            const id = knViewInfo.id;
            const scope = knViewInfo.scope;
            const currentlyFocusedViewIdentifier = this.knGetCurrentlyFocusedViewIdentifier({
              scope: knViewInfo.scope
            });
            if (id === currentlyFocusedViewIdentifier) {
              if (currentlyFocusedViewInfo) {
                throw new Error(`knView ${this.constructor.name}: duplicate knView with same id (${id} detected`);
              }
              currentlyFocusedViewInfo = knViewInfo;
              view.knSetTabStop(true, {
                scope: scope
              });
              log.debug(`KN: scope ${scope}: ${this.constructor.name}: ${id} setting as tabstop`) && console.log(log.last);
            } else {
              view.knSetTabStop(false, {
                scope: scope
              });
              log.debug(`KN: scope ${scope}: ${this.constructor.name}: tabstop removed from ${id}`) && console.log(log.last);
            }
          });
          return currentlyFocusedViewInfo;
        },
        knRemoveAllTabStops: function(knViewsInfos) {
          if (!knViewsInfos) {
            return;
          }
          knViewsInfos.forEach((knViewInfo, index) => {
            const view = knViewInfo.view;
            const scope = knViewInfo.scope;
            view.knSetTabStop(false, {
              scope: scope
            });
          });
        },
        knGetIndexOfCurrentlyFocusedView: function(knViewsInfos, options) {
          const scope = this._scopeFromOptions(options);
          const currentlyFocusedViewIdentifier = this.knGetCurrentlyFocusedViewIdentifier({
            scope: scope
          });
          for (let i = 0; i < knViewsInfos.length; i++) {
            const viewInfo = knViewsInfos[i];
            if (viewInfo.id === currentlyFocusedViewIdentifier) {
              return i;
            }
          }
          return -1;
        },
        knScrollIntoCurrentlyFocusedView: function(options) {
          const knViewsCollection = this.knGetKnViewsCollection(options);
          const currentlyFocusedViewIdentifier = this.knGetCurrentlyFocusedViewIdentifier(options);
          const knViewInfo = knViewsCollection.find(knView => {
            return knView.id === currentlyFocusedViewIdentifier;
          });
          if (knViewInfo) {
            const itemView = knViewInfo.get("view");
            itemView.knGetFocusableElement().scrollIntoView({
              block: "nearest"
            });
          }
        },
        _knCalculateFocusedViewForNavToPrev: function(knSortedViewsInfos, options) {
          let currentKnViewInfo, nextKnViewInfo;
          const i = this.knGetIndexOfCurrentlyFocusedView(knSortedViewsInfos, options);
          if (i >= 0) {
            currentKnViewInfo = knSortedViewsInfos[i];
            if (i > 0) {
              nextKnViewInfo = knSortedViewsInfos[i - 1];
            } else {
              nextKnViewInfo = currentKnViewInfo;
            }
          } else {
            if (knSortedViewsInfos.length > 0) {
              nextKnViewInfo = knSortedViewsInfos[0];
            }
          }
          return {
            currentKnViewInfo: currentKnViewInfo,
            nextKnViewInfo: nextKnViewInfo
          };
        },
        _knCalculateFocusedViewForNavToNext: function(knSortedViewsInfos, options) {
          let currentKnViewInfo, nextKnViewInfo;
          const i = this.knGetIndexOfCurrentlyFocusedView(knSortedViewsInfos, options);
          if (i >= 0) {
            currentKnViewInfo = knSortedViewsInfos[i];
            if (i < knSortedViewsInfos.length - 1) {
              nextKnViewInfo = knSortedViewsInfos[i + 1];
            } else {
              nextKnViewInfo = currentKnViewInfo;
            }
          } else {
            if (knSortedViewsInfos.length > 0) {
              nextKnViewInfo = knSortedViewsInfos[0];
            }
          }
          return {
            currentKnViewInfo: currentKnViewInfo,
            nextKnViewInfo: nextKnViewInfo
          };
        },
        _knCalculateFocusedViewForNavToFirst: function(knSortedViewsInfos, options) {
          let currentKnViewInfo, nextKnViewInfo;
          const i = this.knGetIndexOfCurrentlyFocusedView(knSortedViewsInfos, options);
          if (i >= 0) {
            currentKnViewInfo = knSortedViewsInfos[i];
          }
          if (knSortedViewsInfos.length > 0) {
            nextKnViewInfo = knSortedViewsInfos[0];
          }
          return {
            currentKnViewInfo: currentKnViewInfo,
            nextKnViewInfo: nextKnViewInfo
          };
        },
        _knCalculateFocusedViewForNavToLast: function(knSortedViewsInfos, options) {
          let currentKnViewInfo, nextKnViewInfo;
          const i = this.knGetIndexOfCurrentlyFocusedView(knSortedViewsInfos, options);
          if (i >= 0) {
            currentKnViewInfo = knSortedViewsInfos[i];
          }
          if (knSortedViewsInfos.length > 0) {
            nextKnViewInfo = knSortedViewsInfos[knSortedViewsInfos.length - 1];
          }
          return {
            currentKnViewInfo: currentKnViewInfo,
            nextKnViewInfo: nextKnViewInfo
          };
        },
        _knMoveTabStop: function(currentKnViewInfo, nextKnViewInfo, options) {
          const scope = this._scopeFromOptions(options);
          if (nextKnViewInfo) {
            const nextView = nextKnViewInfo.view;
            this.knSetCurrentlyFocusedViewIdentifier(nextKnViewInfo.id, options);
            nextView.knSetTabStop(true, {
              scope: scope
            });
            log.debug(`KN: scope ${scope}: ${this.constructor.name} focusing knView with id ${nextKnViewInfo.id}`) && console.log(log.last);
            nextView.knFocus({
              scope: scope
            });
          }
          if (currentKnViewInfo && currentKnViewInfo.id !== nextKnViewInfo.id) {
            const currentView = currentKnViewInfo.view;
            currentView.knSetTabStop(false, {
              scope: scope
            });
          }
          if (nextKnViewInfo) {
            return nextKnViewInfo.id;
          } else {
            return "";
          }
        },
        knFocusIfNeeded: function(options) {
          const id = this.knGetIdentifier(options);
          const currentlyFocusedViewIdentifier = this.knGetCurrentlyFocusedViewIdentifier(options);
          if (id === currentlyFocusedViewIdentifier) {
            this.knFocus(options);
          }
        },
        knNavigateToPrev: function(options) {
          const scope = this._scopeFromOptions(options);
          if (!this._knMixin[scope].knViewsCollection?.length) {
            return "";
          }
          const knSortedViewsInfos = this.knGetKnViewsSorted(options);
          const {
            currentKnViewInfo,
            nextKnViewInfo
          } = this._knCalculateFocusedViewForNavToPrev(knSortedViewsInfos, options);
          return this._knMoveTabStop(currentKnViewInfo, nextKnViewInfo, options);
        },
        knNavigateToNext: function(options) {
          const scope = this._scopeFromOptions(options);
          if (!this._knMixin[scope].knViewsCollection?.length) {
            return "";
          }
          const knSortedViewsInfos = this.knGetKnViewsSorted(options);
          const {
            currentKnViewInfo,
            nextKnViewInfo
          } = this._knCalculateFocusedViewForNavToNext(knSortedViewsInfos, options);
          return this._knMoveTabStop(currentKnViewInfo, nextKnViewInfo, options);
        },
        knNavigateToFirst: function(options) {
          const scope = this._scopeFromOptions(options);
          if (!this._knMixin[scope].knViewsCollection?.length) {
            return "";
          }
          const knSortedViewsInfos = this.knGetKnViewsSorted(options);
          const {
            currentKnViewInfo,
            nextKnViewInfo
          } = this._knCalculateFocusedViewForNavToFirst(knSortedViewsInfos, options);
          return this._knMoveTabStop(currentKnViewInfo, nextKnViewInfo, options);
        },
        knNavigateToLast: function(options) {
          const scope = this._scopeFromOptions(options);
          if (!this._knMixin[scope].knViewsCollection?.length) {
            return "";
          }
          const knSortedViewsInfos = this.knGetKnViewsSorted(options);
          const {
            currentKnViewInfo,
            nextKnViewInfo
          } = this._knCalculateFocusedViewForNavToLast(knSortedViewsInfos, options);
          return this._knMoveTabStop(currentKnViewInfo, nextKnViewInfo, options);
        },
        knNavigateToThisView: function(options) {
          const scope = this._scopeFromOptions(options);
          if (!this._knMixin[scope].knViewsCollection?.length) {
            return "";
          }
          const knViewsInfos = this._knMixin[scope].knViewsCollection.map(knViewInfoModel => {
            const knView = knViewInfoModel.get("view");
            return {
              view: knView,
              id: knViewInfoModel.get("id")
            };
          });
          let currentKnViewInfo, nextKnViewInfo;
          const i = this.knGetIndexOfCurrentlyFocusedView(knViewsInfos, options);
          if (i >= 0) {
            currentKnViewInfo = knViewsInfos[i];
          }
          if (knViewsInfos.length > 0) {
            nextKnViewInfo = {
              view: this,
              id: this.knGetIdentifier({
                scope: scope
              })
            };
          }
          return this._knMoveTabStop(currentKnViewInfo, nextKnViewInfo, options);
        },
        knGetIdentifier: function(options) {
          const scope = this._scopeFromOptions(options);
          if (this._knMixin[scope].id) {
            if (_.isString(this._knMixin[scope].id)) {
              return this._knMixin[scope].id;
            } else {
              if (_.isFunction(this._knMixin[scope].id)) {
                return this._knMixin[scope].id.call(this, {
                  scope: scope
                });
              } else {
                if (_.isFunction(this[this._knMixin[scope].id])) {
                  return this[this._knMixin[scope].id].call(this, {
                    scope: scope
                  });
                } else {
                  throw new Error(`knView ${this.constructor.name}: scope ${scope}: id from kn-mixin options is not a function`);
                }
              }
            }
          } else {
            if (_.isFunction(this._knGetIdentifier)) {
              return this._knGetIdentifier({
                scope: scope
              });
            } else {
              throw new Error(`knView ${this.constructor.name}: scope ${scope}: id is not specified in kn-mixin options and this._knGetIdentifier is not a function`);
            }
          }
        },
        knSetTabStop: function(isTabStop, options) {
          const scope = this._scopeFromOptions(options);
          if (this._knMixin[scope].setTabStop) {
            if (_.isFunction(this._knMixin[scope].setTabStop)) {
              return this._knMixin[scope].setTabStop.call(this, isTabStop, {
                scope: scope
              });
            } else {
              if (_.isFunction(this[this._knMixin[scope].setTabStop])) {
                return this[this._knMixin[scope].setTabStop].call(this, isTabStop, {
                  scope: scope
                });
              } else {
                throw new Error(`knView ${this.constructor.name}: scope ${scope}: setTabStop from kn-mixin options is not a function`);
              }
            }
          } else {
            if (_.isFunction(this._knSetTabStop)) {
              return this._knSetTabStop(isTabStop, {
                scope: scope
              });
            } else {
              throw new Error(`knView ${this.constructor.name}: scope ${scope}: setTabStop is not specified in kn-mixin options and this._knSetTabStop is not a function`);
            }
          }
        },
        knGetFocusableElement: function(options) {
          const scope = this._scopeFromOptions(options);
          if (this._knMixin[scope].getFocusableElement) {
            if (_.isFunction(this._knMixin[scope].getFocusableElement)) {
              return this._knMixin[scope].getFocusableElement.call(this, {
                scope: scope
              });
            } else {
              if (_.isFunction(this[this._knMixin[scope].getFocusableElement])) {
                return this[this._knMixin[scope].getFocusableElement].call(this, {
                  scope: scope
                });
              } else {
                throw new Error(`knView ${this.constructor.name}: scope ${scope}: getFocusableElement from kn-mixin options is not a function`);
              }
            }
          } else {
            if (_.isFunction(this._knGetFocusableElement)) {
              return this._knGetFocusableElement({
                scope: scope
              });
            } else {
              if (this._isRendered) {
                return this.el;
              } else {
                throw new Error(`knView ${this.constructor.name}: scope ${scope}: getFocusableElement is not specified in kn-mixin options and this._knGetFocusableElement is not a function`);
              }
            }
          }
        },
        knFocus: function(options) {
          const scope = this._scopeFromOptions(options);
          if (this._knMixin[scope].focus) {
            if (_.isFunction(this._knMixin[scope].focus)) {
              return this._knMixin[scope].focus.call(this, {
                scope: scope
              });
            } else {
              if (_.isFunction(this[this._knMixin[scope].focus])) {
                return this[this._knMixin[scope].focus].call(this, {
                  scope: scope
                });
              } else {
                throw new Error(`knView ${this.constructor.name}: scope ${scope}: focus from kn-mixin options is not a function`);
              }
            }
          } else {
            if (_.isFunction(this._knFocus)) {
              return this._knFocus({
                scope: scope
              });
            } else {
              if (this._isRendered) {
                this.el.focus();
              } else {
                throw new Error(`knView ${this.constructor.name}: scope ${scope}: focus is not specified in kn-mixin options and this._knFocus is not a function`);
              }
            }
          }
        },
        _addToKnViewsCollection: function(options) {
          const scope = this._scopeFromOptions(options);
          const id = this.knGetIdentifier({
            scope: scope
          });
          log.debug(`KN: scope ${scope}: ${this.constructor.name} adding view with id ${id}`) && console.log(log.last);
          this._knMixin[scope].knViewsCollection.add({
            id: id,
            view: this
          });
        }
      });
    }
  };
});