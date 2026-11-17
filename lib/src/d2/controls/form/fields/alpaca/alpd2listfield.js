/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/lib/alpaca/js/alpaca.lite", "d2/controls/form/fields/listfieldview/d2listfield.view", "d2/utils/combo.datasource.utils", "dctmw/controls/form/fields/alpaca/alpdctmwlistfield" ], function(_, Alpaca, D2ListFieldView, ComboDataSourceUtils) {
  "use strict";
  Alpaca.Fields.D2ListField = Alpaca.Fields.DctmwListField.extend({
    constructor: function D2SelectField(container, data, options, schema, view, connector, onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },
    getFieldType: function() {
      return "d2list";
    },
    getFieldViewClass: function() {
      return D2ListFieldView;
    },
    collectionDataExtractor: function(data) {
      let res = this.base(data);
      res.category = data.category;
      res.invalid = _.isString(data.category) && /Error/.test(data.category);
      return res;
    },
    loadDataFromDataSource: function() {
      let collectionData = this.base();
      if (!collectionData && this.options.ds && (this.options.ds.assistance_type === "taxonomy" || this.options.ds.assistance_type === "dictionary") && this.data) {
        var dataArray = ComboDataSourceUtils.getValues(this);
        if (dataArray.length) {
          collectionData = this.collectionDataPopulator(dataArray);
        }
      }
      return collectionData;
    }
  });
  Alpaca.registerFieldClass("d2list", Alpaca.Fields.D2ListField, "bootstrap-csui");
  return Alpaca.Fields.D2ListField;
});