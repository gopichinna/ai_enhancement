/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(function () {
  'use strict';

  var nodeExpands = ['original_id', 'parent_id', 'volume_id'],
    userExpands = ['create_user_id', 'modify_user_id', 'owner_user_id', 'reserved_user_id'],
    groupExpands = ['owner_group_id'],
    memberExpands = userExpands.concat(groupExpands);

  // Returns a v2 expand scope string or an object with key-array pairs.
  function includeExpandsV1toV2(expands) {
    // An array can be converted to an object with key-array pairs.
    if (Array.isArray(expands)) {
      return expands.reduce(function (result, expand) {
        if (expand === 'node') {
          mergeProperties(result, nodeExpands);
        } else if (expand === 'member') {
          mergeProperties(result, memberExpands);
        } else if (expand === 'user') {
          mergeProperties(result, userExpands);
        } else if (expand === 'group') {
          mergeProperties(result, groupExpands);
        } else {
          result[expand] || (result[expand] = []);
        }
        return result;
      }, {});
      // A v1 string can be converted an object with a single key-array pair.
    } else if (expands === 'node') {
      return {
        properties: nodeExpands.slice()
      };
      // A v1 string can be converted an object with a single key-array pair.
    } else if (expands === 'member') {
      return {
        properties: memberExpands.slice()
      };
    } else if (expands === 'user') {
      return {
        properties: userExpands.slice()
      };
    } else if (expands === 'group') {
      return {
        properties: groupExpands.slice()
      };
    }
    // Leave an object or a v2 string intact.
    return expands;

    function mergeProperties(result, expands) {
      var properties = result.properties || (result.properties = []);
      expands.forEach(function (property) {
        if (properties.indexOf(property) < 0) {
          properties.push(property);
        }
      });
    }
  }

  // Returns a v2 expand scope string or an array of them.
  function excludeExpandsV1toV2(expands) {
    if (Array.isArray(expands)) {
      return expands.reduce(function (result, expand) {
        if (expand === 'node' || expand === 'user' || expand === 'group' || expand === 'member') {
          expand = 'properties';
        }
        if (result.indexOf(expand) < 0) {
          result.push(expand);
        }
        return result;
      }, []);
    } else if (expands === 'node') {
      return nodeExpands.slice();
    } else if (expands === 'member') {
      return memberExpands.slice();
    } else if (expands === 'user' || expands === 'member') {
      return userExpands.slice();
    } else if (expands === 'group') {
      return groupExpands.slice();
    }
    return expands;
  }

  // Returns a v1 expand scope string or an array with them.
  function expandsV2toV1(expands) {
    // An array can be converted to an array.
    if (Array.isArray(expands)) {
      return expands.reduce(function (result, expand) {
        if (nodeExpands.indexOf(expand) >= 0) {
          result.push('node');
        } else if (userExpands.indexOf(expand) >= 0) {
          result.push('user');
        } else if (groupExpands.indexOf(expand) >= 0) {
          result.push('group');
        }
        return result;
      }, []);
      // An object can be converted to an array with v1 scopes.
    } else if (typeof expands === 'object') {
      var properties = expands.properties;
      if (properties) {
        if (!properties.length) {
          return ['node', 'member'];
        }
        return properties.reduce(function (result, expand) {
          if (nodeExpands.indexOf(expand) >= 0) {
            expand = 'node';
          } else if (userExpands.indexOf(expand) >= 0) {
            expand = 'user';
          } else if (groupExpands.indexOf(expand) >= 0) {
            expand = 'group';
          }
          if (result.indexOf(expand) < 0) {
            result.push(expand);
          }
          return result;
        }, []);
      }
      return [];
      // A v2 string can be converted to a v1 string.
    } else if (expands === 'properties') {
      return ['node', 'member'];
    }
    // Leave a v1 string intact.
    return expands;
  }

  return {
    includeExpandsV1toV2: includeExpandsV1toV2,
    excludeExpandsV1toV2: excludeExpandsV1toV2,
    expandsV2toV1: expandsV2toV1,
    nodeExpands: nodeExpands,
    userExpands: userExpands
  };
});
