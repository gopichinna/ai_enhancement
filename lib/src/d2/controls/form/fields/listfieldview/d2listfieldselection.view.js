/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/controls/form/fields/listfieldview/dctmwlistfieldselection.view", "d2/controls/form/fields/listfieldview/d2listfieldselectionitem.view" ], function(_, DctmwListFieldSelection, SelectionItemView) {
  "use strict";
  return DctmwListFieldSelection.extend({
    childView: SelectionItemView,
    constructor: function D2ListFieldSelctionView(options) {
      DctmwListFieldSelection.prototype.constructor.call(this, options);
    },
    className: function() {
      return _.result(DctmwListFieldSelection.prototype, "className") + " dctmw-listfield-selection-wrapper";
    },
    _prepareOptions: function(opts) {
      let options = DctmwListFieldSelection.prototype._prepareOptions.call(this, opts);
      return {
        ...options,
        isAutoSelectSingle: opts.isAutoSelectSingle,
        isAutoSelectMulti: opts.isAutoSelectMulti
      };
    },
    setDefaultValuesOnWrite: function() {
      DctmwListFieldSelection.prototype.setDefaultValuesOnWrite.call(this);
      if (this.collection.length === 0) {
        var defaultSelectedModels = [];
        if (this.options.isAutoSelectSingle && this.options.optionsCollection.length === 1) {
          this.options.optionsCollection.first().set("selected", true, {
            silent: true
          });
          defaultSelectedModels.push(this.options.optionsCollection.first().clone());
        } else if (this.options.isAutoSelectMulti) {
          this.options.optionsCollection.each(function(model) {
            model.set("selected", true, {
              silent: true
            });
            defaultSelectedModels.push(model.clone());
          }, this);
        }
        if (defaultSelectedModels.length > 0) {
          this.collection.add(defaultSelectedModels);
          this.show();
        }
      }
    }
  });
});