/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['module', 'nuc/lib/underscore', 'nuc/utils/url', 'nuc/utils/log'], function (module, _, Url, log) {
  'use strict';

  log = log(module.id);

  var FILTERS_SEPARATOR = '||';

  var BrowsableMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeBrowsable: function (options) {
          options || (options = {});
          this.skipCount = options.skip || 0;
          this.topCount = options.top || 0;
          this.filters = options.filter || {};
          this.orderBy = options.orderBy;
          if (_.isString(this.filters)) {
            try {
              this.filters = JSON.parse(this.filters);
            } catch (e) {
              this.filters = {};
            }
          }
          return this;
        },

        setFilter: function (value, attributes, options) {
          // TODO: Simplify filer merging and detection of changes.
          var filter = value,
            name,
            modified;
          if (_.isObject(value) && !_.isArray(value)) {
            options = attributes;
          } else {
            filter = {};
            filter[attributes] = value;
          }
          if (typeof options !== 'object') {
            options = { fetch: options };
          }
          if (!_.isEmpty(filter)) {
            for (name in filter) {
              if (_.has(filter, name)) {
                value = filter[name];
                if (makeFilterValue(this.filters[name], name) !== makeFilterValue(value, name)) {
                  if (value !== undefined) {
                    this.filters[name] = value;
                  } else {
                    delete this.filters[name];
                  }
                  modified = true;
                }
              }
            }
            if (options.clear) {
              for (name in this.filters) {
                if (_.has(this.filters, name) && !_.has(filter, name)) {
                  if (makeFilterValue(this.filters[name], name) !== undefined) {
                    delete this.filters[name];
                    modified = true;
                  }
                }
              }
            }
            if (modified) {
              this.trigger('filter:change');
              if (options.fetch !== false) {
                this.fetch();
              }
              return true;
            }
          } else {
            if (options.clear) {
              return this.clearFilter(options.fetch);
            }
          }
        },

        clearFilter: function (fetch) {
          var modified;
          if (!_.isEmpty(this.filters)) {
            for (var name in this.filters) {
              if (_.has(this.filters, name)) {
                if (makeFilterValue(this.filters[name], name) !== undefined) {
                  delete this.filters[name];
                  modified = true;
                }
              }
            }
          }
          if (modified) {
            this.trigger('filter:clear');
            if (fetch !== false) {
              this.fetch();
            }
            return true;
          }
        },

        getFilterAsObject: function () {
          var filtersObject = {},
            filters = this.filters;
          if (filters) {
            _.forEach(_.keys(filters), function (key) {
              var collectionFilters = filters[key];
              if (_.isArray(collectionFilters)) {
                var filtersArray = collectionFilters.map(function (entry) {
                  if (entry && typeof entry === 'string') {
                    // 'key'               => key: undefined
                    // 'key:'              => key: []
                    // 'key:value'         => key: [{ id: 'value' }]
                    // 'key:value1|value2' => key: [{ id: 'value1' }, { id: 'value2' }]
                    var filter = entry && entry.split(/:(.*)/);
                    var values = filter[1] && splitFilterValue(filter[1]);
                    values =
                      values &&
                      values.map(function (value) {
                        return { id: value };
                      });
                    return {
                      id: filter[0],
                      values: (values === '' && []) || values
                    };
                  }
                  return entry;
                });
                collectionFilters = filtersArray && filtersArray.length > 0 ? filtersArray : undefined;
              }
              if (collectionFilters) {
                filtersObject[key] = collectionFilters;
              }
            });
          }
          return filtersObject;
        },

        getFilterAsString: function () {
          log.deprecate('The method getFilterAsString will be removed. It is unused in CSUI.') &&
            console.warn(log.last);
          var filtersString = '',
            filters = this.filters;
          if (filters) {
            _.forEach(_.keys(filters), function (key) {
              var value = filters[key];
              if (value) {
                if (filtersString) {
                  filtersString += FILTERS_SEPARATOR;
                }
                if (value && _.isArray(value)) {
                  if (value.length > 0) {
                    filtersString += key + '=' + '[' + value + ']';
                  }
                } else {
                  filtersString += key + '=' + value;
                }
              }
            });
          }
          return filtersString;
        },

        filterStringToObject: function (filtersString) {
          log.deprecate('The method filterStringToObject will be removed. It is unused in CSUI.') &&
            console.warn(log.last);
          var filters = filtersString.split(FILTERS_SEPARATOR),
            filtersObject = {};

          _.each(filters, function (filter) {
            var filterArray = filter.split('=');
            var values = filterArray[1];
            if (values && values.charAt(0) === '[') {
              values = values.substring(1, values.length - 1).split(',');
            }
            filtersObject[filterArray[0]] = values;
          });

          return filtersObject;
        },

        setOrder: function (attributes, fetch) {
          if (this.orderBy != attributes) {
            this.orderBy = attributes;
            if (fetch !== false) {
              this.fetch({ skipSort: false });
            }
            this.trigger('orderBy:change');
            return true;
          }
        },

        resetOrder: function (fetch) {
          if (this.orderBy) {
            this.orderBy = undefined;
            this.trigger('orderBy:clear');
            if (fetch !== false) {
              this.fetch();
            }
            return true;
          }
        },

        setSkip: function (skip, fetch) {
          if (this.skipCount != skip) {
            this.skipCount = skip;
            this.trigger('paging:change');
            if (fetch !== false) {
              this.fetch();
            }
            return true;
          }
        },

        setTop: function (top, fetch) {
          if (this.topCount != top) {
            this.topCount = top;
            this.trigger('paging:change');
            if (fetch !== false) {
              this.fetch();
            }
            return true;
          }
        },

        setLimit: function (skip, top, fetch) {
          if (this.skipCount != skip || this.topCount != top) {
            this.skipCount = skip;
            this.topCount = top;
            this.trigger('paging:change');
            if (fetch !== false) {
              this.fetch();
            }
            return true;
          }
        },

        resetLimit: function (fetch) {
          if (this.skipCount) {
            this.skipCount = 0;
            this.trigger('limits:change');
            if (fetch !== false) {
              this.fetch();
            }
            return true;
          }
        }
      });
    }
  };

  function makeFilterValue(value, name) {
    if (value !== undefined && value !== null && value !== '') {
      if (_.isArray(value)) {
        value = Url.makeMultivalueParameter('where_' + name, value);
      } else {
        value = 'where_' + name + '=' + encodeURIComponent(value.toString());
      }
      if (value.length > 0) {
        return value;
      }
    }
  }

  function splitFilterValue(value) {
    // 'value1|value2'       => ['value1', 'value2']
    // 'value{|}1|value{|}2' => ['value|1', 'value|2']
    const items = [];
    for (let startIndex = 0, itemIndex = 0; ; ) {
      const pipeIndex = value.indexOf('|', startIndex);
      if (pipeIndex >= 0) {
        if (value.charAt(pipeIndex - 1) !== '{' && value.charAt(pipeIndex + 1) !== '}') {
          items.push(unescapeFilterValue(value.substring(itemIndex, pipeIndex)));
          itemIndex = pipeIndex + 1;
        }
        startIndex = pipeIndex + 1;
      } else {
        items.push(unescapeFilterValue(value.substring(itemIndex)));
        break;
      }
    }
    return items;
  }

  function unescapeFilterValue(value) {
    return value.replace(/{\|}/g, '|');
  }

  return BrowsableMixin;
});
