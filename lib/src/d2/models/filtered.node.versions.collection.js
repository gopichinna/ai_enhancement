/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import NodeVersions from "csui/models/nodeversions";

import Url from "nuc/utils/url";

import _ from "nuc/lib/underscore";

const filteredNodeVersionsCollection = NodeVersions.extend({
  url() {
    _.defaults(this.options, this.options.customCollectionOptions || {});
    let queryParams = {
      "major-versions-only": this.options.majorVersionsOnly || false,
      "minor-versions-of": this.options.minorVersionsOf ?? ""
    };
    return Url.appendQuery(NodeVersions.prototype.url.apply(this, arguments), Url.combineQueryString(queryParams));
  }
});

export default filteredNodeVersionsCollection;