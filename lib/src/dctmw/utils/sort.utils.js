/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "i18n", "dctmw/utils/constants", "dctmw/utils/vdoc.utils" ], function(_, i18n, constants, vdUtil) {
  "use strict";
  var locale = i18n.settings.locale, filter = {
    usage: "sort",
    sensitivity: "variant",
    numeric: false
  };
  function containerWeight(node) {
    var type = node.get("type");
    return type === constants.Types.FOLDER || type === constants.Types.CABINET ? 0 : 1;
  }
  function parseValue(value, type) {
    if (value != null && type === -7) {
      if (_.isArray(value)) {
        return value.map(function(val) {
          return new Date(val);
        });
      } else {
        return new Date(value);
      }
    }
    if (value === null && type === -1) {
      return "";
    }
    return value;
  }
  function compareValues(left, right) {
    if (_.isArray(left) || _.isArray(right)) {
      if (!_.isArray(left)) {
        left = [ left ];
      } else if (!_.isArray(right)) {
        right = [ right ];
      }
      return compareArrays(left, right);
    }
    return compareObjects(left, right);
  }
  function compareArrays(left, right) {
    var result = 0, len = Math.min(left.length, right.length), i = 0;
    while (i <= len) {
      if (i === left.length && i === right.length) {
        result = 0;
        break;
      } else if (i === left.length) {
        result = -1;
        break;
      } else if (i === right.length) {
        result = 1;
        break;
      } else {
        result = compareObjects(left[i], right[i]);
        if (result !== 0) {
          break;
        }
      }
      i++;
    }
    return result;
  }
  function compareObjects(left, right) {
    if (left !== right) {
      if (right === void 0) {
        return 1;
      }
      if (left === void 0) {
        return -1;
      }
      if (typeof left === "string" && typeof right === "string") {
        left = left.toLowerCase();
        right = right.toLowerCase();
        if (Object.compare) {
          try {
            return Object.compare(new Intl.collator(locale, filter), left, right);
          } catch (error) {
            console.warn(error);
          }
        }
      }
      return left < right ? -1 : left > right ? 1 : 0;
    }
    return 0;
  }
  function compareVersionList(leftVersions, rightVersions) {
    if (!_.isArray(leftVersions)) {
      leftVersions = [ leftVersions ];
    }
    if (!_.isArray(rightVersions)) {
      rightVersions = [ rightVersions ];
    }
    var left = leftVersions.slice(0);
    var right = rightVersions.slice(0);
    var leftVersion = left.shift();
    var rightVersion = right.shift();
    if (leftVersion === rightVersion) {
      return compareValues(left, right);
    } else if (rightVersion === void 0) {
      return 1;
    } else if (leftVersion === void 0) {
      return -1;
    } else {
      var result = compareVersion(leftVersion, rightVersion);
      if (result === 0) {
        return compareValues(left, right);
      }
      return result;
    }
  }
  function compareVersion(a, b) {
    var i, diff;
    var regExStrip0 = /(\.0+)+$/;
    var segmentsA = a.replace(regExStrip0, "").split(".");
    var segmentsB = b.replace(regExStrip0, "").split(".");
    var l = Math.min(segmentsA.length, segmentsB.length);
    for (i = 0; i < l; i++) {
      diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
      if (diff) {
        return diff;
      }
    }
    return segmentsA.length - segmentsB.length;
  }
  return {
    compare: function(property, left, right, type, orderFolderFirst, orderBy) {
      if (orderFolderFirst === true) {
        var leftWeight = containerWeight(left), rightWeight = containerWeight(right);
        if (leftWeight !== rightWeight) {
          var output = leftWeight - rightWeight;
          if (_.isString(orderBy)) {
            orderBy = orderBy.toLowerCase().trim();
            if (orderBy.split(" ")[1] === "desc") {
              output = -1 * output;
            }
          }
          return output;
        }
      }
      left = parseValue(left.get(property), type);
      right = parseValue(right.get(property), type);
      var propertyList = property.split(".");
      if (_.any([ "r_version_label", "d2_version_label", vdUtil.PROP_VDM_NUMBER ], function(prop) {
        return _.contains(propertyList, prop);
      })) {
        return compareVersionList(left, right);
      }
      return compareValues(left, right);
    },
    compareVersions: function(left, right) {
      return compareVersion(left, right);
    },
    getSortColumnSchema: function(columns = [], property) {
      const col = columns.find(function(col) {
        return col.column_key === property;
      });
      return {
        key: col && col._sorting_key || property,
        type: col && col._sorting_type || col && col.type || -1
      };
    }
  };
});