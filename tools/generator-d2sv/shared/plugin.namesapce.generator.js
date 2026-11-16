/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const _ = require("./lodash-complete");

function getPluginNSFromPackageName(packageName) {
  if (_.isString(packageName)) {
    return packageName.replace(/\W/g, "").toLowerCase();
  }
}

function getPluginNSFromArtifactId(artifactId) {
  return getPluginPackageNameFromArtifactId(artifactId).toLowerCase();
}

function getPluginPackageNameFromArtifactId(artifactId) {
  if (_.isString(artifactId)) {
    const parts = artifactId.split(/\W/);
    let packageName = _.chain(parts).map(part => part.charAt(0).toUpperCase() + part.substring(1)).map((part, index) => {
      if (index === 0 || index === parts.length - 1) {
        return part;
      } else {
        return _.chain(part.split("")).filter(letter => letter === letter.toUpperCase()).reduce((memo, uLetter) => memo + uLetter, "").value();
      }
    }).reduce((memo, part) => memo + part, "").value();
    return packageName;
  }
  return "";
}

module.exports = {
  getPluginPackageNameFromArtifactId: getPluginPackageNameFromArtifactId,
  getPluginNSFromPackageName: getPluginNSFromPackageName,
  getPluginNSFromArtifactId: getPluginNSFromArtifactId
};