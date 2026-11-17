/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Collection,
  Model
} from "nuc/lib/backbone";

let utils = {
  buildModels: function(models = []) {
    return models.map(topic => new Model(_.pick(topic.attributes, [ "id", "facet-id", "parent-id", "facet-value", "checked", "name", "label", "type", "value", "multiselect", "showTotal", "total" ])));
  },
  updateHighlightString: function(highlightText, items) {
    if (!highlightText) {
      items.forEach(item => item.unset("highlightedname"));
    } else {
      const escapedInput = highlightText.toLowerCase().replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&"), regex = new RegExp(`(${escapedInput})`, "gi");
      items.forEach(item => {
        const name = item.get("name");
        item.set("highlightedname", name.replace(regex, "<HH>$1</HH>"));
      });
    }
  },
  buildSubCollection: function(items, columnCount, columnSize) {
    if (items.length > columnCount * columnSize) {
      throw new Error("received a larger collection");
    }
    const chunks = [];
    for (let i = 0; i < columnCount; i++) {
      let start = i * columnSize, end = (i + 1) * columnSize, model = new Model({});
      model.nodes = new Collection([ ...items.slice(start, end) ]);
      chunks.push(model);
    }
    return new Collection(chunks);
  },
  unSelectAllModels: function(models) {
    models.forEach(model => model.unset("checked"));
  }
};

export default utils;