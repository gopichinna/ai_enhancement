/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/models/form", "d2/widgets/metadata/utils/form.converter", "d2/controls/form/d2.form.view", "hbs!d2/dialogs/about.d2/impl/about.d2.form", "i18n!d2/dialogs/about.d2/impl/nls/lang" ], function(_, FormModel, MetadataConverter, D2FormView, formTemplate, lang) {
  "use strict";
  return D2FormView.extend({
    formTemplate: formTemplate,
    constructor: function AboutD2FormView(options) {
      options || (options = {});
      var dialog = this._createDialogJson(options.data);
      this.formmodel = MetadataConverter.convertConfig(dialog, {
        actionMode: "read"
      });
      options.model = new FormModel(this.formmodel.propertiesConfig[0]);
      options.topAlignedLabel = true;
      options.mode = "read";
      D2FormView.prototype.constructor.call(this, options);
    },
    _createDialogJson: function(data) {
      var form = {
        order: 1,
        fieldset: {
          order: 1,
          tabs: {
            order: 1,
            tab: [ {
              order: 1,
              label: lang.TabLabelAbout,
              usePerfectScrollbar: true,
              "html-editor": {
                order: 1,
                id: "about",
                control: true,
                label: "",
                value: _.str.sformat(lang.AboutD2Blurb)
              }
            }, {
              order: 2,
              usePerfectScrollbar: true
            }, {
              order: 3,
              usePerfectScrollbar: true
            } ]
          }
        }
      }, d2TabData = [ "D2ArchiveConfigVersion", "D2DocAppVersion", "D2ApiServerVersion", "D2fsVersion", "D2fs4DctmVersion", "D2ApiVersion", "D2Plugin" ], sysTabData = [ "ServerVersion", "JdkVersion", "DfVersion", "DocumentumVersion" ], d2TabList = [ lang.TabLabelD2Information ], sysTabList = [ lang.TabLabelSystemInformation ], order = 1;
      _.each(d2TabData, function(item) {
        d2TabList.push({
          order: order++,
          id: item,
          label: data[item].label,
          value: data[item].value
        });
      });
      form.fieldset.tabs.tab[1].label = d2TabList;
      order = 1;
      _.each(sysTabData, function(item) {
        sysTabList.push({
          order: order++,
          id: item,
          label: data[item].label,
          value: data[item].value
        });
      });
      form.fieldset.tabs.tab[2].label = sysTabList;
      return {
        dialog: {
          content: form
        }
      };
    }
  });
});