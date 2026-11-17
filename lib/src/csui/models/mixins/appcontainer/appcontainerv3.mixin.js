/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/browsable/v1.request.mixin", "csui/utils/url" ], function(BrowsableV1RequestMixin, Url) {
  "use strict";
  const AppContainerv2Mixin = {
    mixin: function(prototype) {
      BrowsableV1RequestMixin.mixin(prototype);
      return Object.assign(prototype, {
        makeAppContainer: function(_options) {
          return this;
        },
        createQueryParams: function() {
          let queryParam = "";
          let {
            topCount,
            skipCount,
            orderBy,
            filters
          } = this.children;
          const pageSize = topCount;
          const pageNo = Math.floor((skipCount || 0) / pageSize) + 1;
          queryParam = `?page_size=${pageSize}`;
          if (pageNo > 1) {
            queryParam += `&page=${pageNo}`;
          }
          if (orderBy) {
            let first = orderBy.split(",")[0].split(" ");
            if (orderBy.toLowerCase() === "relevance") {
              queryParam += `&sort=${orderBy}`;
            } else {
              queryParam += `&sort=${(first[1] || "asc") + "_" + first[0]}`;
            }
          }
          queryParam += this.getFilterParam(filters);
          return queryParam;
        },
        getFilterParam: function(filters) {
          let facetQuery = {};
          for (let name in filters) {
            if (filters.hasOwnProperty(name)) {
              const param = makeFilterParam(filters[name], name);
              let filterArray = [];
              if (param?.value instanceof Array) {
                filterArray = param.value[0] instanceof Object ? this.getFilterValue(param.value) : param.value;
              } else {
                filterArray = param.value;
              }
              if (param.key) {
                facetQuery[param.key] = filterArray;
              }
            }
          }
          const filterParam = Url.combineQueryString(facetQuery);
          if (!filterParam) return "";
          return `&${filterParam}`;
        },
        massageAddableTypes: function(addableTypes) {
          let addableType = {
            data: {},
            definitions: {}
          };
          for (let tempAddableType of addableTypes) {
            const {
              type,
              name,
              url
            } = tempAddableType;
            const typeObjDef = name?.split(" ").join("_").toLocaleLowerCase();
            addableType.data[typeObjDef] = url;
            addableType.definitions[typeObjDef] = {
              name: name,
              type: type
            };
          }
          return addableType;
        },
        massageResponse: function(properties, references) {
          const referenceNodes = references?.nodes || {};
          const referenceMembers = references?.members || {};
          const expandFields = [ "original", "create_user", "owner_user", "reserved_user", "modify_user", "parent" ];
          expandFields.forEach(field => {
            const idKey = `${field}_id`;
            const expandKey = `${idKey}_expand`;
            const reference = referenceNodes[properties[idKey]] || referenceMembers[properties[idKey]];
            if (reference) {
              properties[expandKey] = {
                ...reference,
                id: properties[idKey]
              };
            }
          });
          properties.reserved = !!properties.reserved_user_id;
          properties.actions = properties.data?.actions;
          if (properties.parent_id && !properties.parent_id_expand) {
            properties.parent_id_expand = {
              id: this.node.get("id"),
              type: this.node.get("type"),
              name: this.node.get("name"),
              openable: this.node.get("openable")
            };
          }
          if (properties.parent_id_expand) {
            properties.parent_id_expand.container = true;
            properties.parent_id_expand.mime_type ||= null;
          }
          return properties;
        },
        createCollection: function(response) {
          let collection = {
            paging: {},
            sorting: {
              sort: []
            }
          };
          const tResult = structuredClone(response.results);
          if (tResult.paging) {
            collection.paging = tResult.paging;
          }
          collection.paging.limit = this.children.topCount;
          if (tResult.sorting instanceof Object) {
            collection.sorting.sort.push(tResult.sorting);
          }
          delete collection.paging.types;
          response.collection = collection;
        }
      });
    }
  };
  function makeFilterParam(value, name) {
    let param = {};
    if (value) {
      param.key = `where_${name}`;
      param.value = value;
    }
    return param;
  }
  return AppContainerv2Mixin;
});