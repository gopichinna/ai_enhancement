/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/perspective.manage/jato/settings.panel/settings/light.mode.icon.backgroundcolor.setting", "csui/perspective.manage/jato/settings.panel/settings/dark.mode.icon.backgroundcolor.setting", "csui/perspective.manage/jato/settings.panel/settings/branding.text", "csui-ext!csui/perspective.manage/settings.panel/setting.items" ], function(_, Backbone, lightBrandingForm, darkBrandingForm, textSettingsForm, extraAccordions) {
  var BrandingAccordionModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      title: null,
      name: "",
      contentView: null,
      contentViewOptions: null
    },
    constructor: function BrandingAccordionModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });
  var BrandingAccordionCollection = Backbone.Collection.extend({
    model: BrandingAccordionModel,
    comparator: "sequence",
    constructor: function BrandingAccordionCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }
  });
  var BrandingAccordions = new BrandingAccordionCollection([ {
    sequence: 10,
    contentView: lightBrandingForm
  }, {
    sequence: 20,
    contentView: darkBrandingForm
  }, {
    sequence: 30,
    contentView: textSettingsForm
  } ]);
  if (extraAccordions) {
    BrandingAccordions.add(_.flatten(extraAccordions, true));
  }
  return BrandingAccordions;
});