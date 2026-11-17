/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "d2/utils/constants", "hbs!d2/dialogs/mass.update/mass.update.empty/mass.update.empty", "i18n!d2/commands/nls/localized.strings", "css!d2/dialogs/mass.update/mass.update.empty/mass.update.empty" ], function(_, $, Marionette, constants, template, lang) {
  var NoValidFilesView = Marionette.ItemView.extend({
    constructor: function NoValidFilesView(options) {
      this.options = options;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    className: "d2-mass-update-no-files-text",
    template: template,
    templateHelpers: function() {
      return {
        text: _.str.sformat(lang.NoValidFilesMessage, this.options.massUpdateConfig["massupdate_config_name"])
      };
    },
    getTitle: function() {
      return lang.MassUpdateDocsValidationHeader;
    },
    getSubTitle: function() {
      var invalidFilesCount = this.options.massUpdateData.massUpdateValidationData["massUpdateNotApplicableCount"], str = this.options.massUpdateOptions["update-types"] === constants.MassUpdateOptions.FOLDER_PROPERTIES ? lang.MassUpdatePropertyPageFoldersSubtitle : this.options.massUpdateOptions["update-types"] === constants.MassUpdateOptions.FILE_PROPERTIES ? lang.MassUpdatePropertyPageFilesSubtitle : lang.MassUpdatePropertyPageItemsSubtitle;
      return _.str.sformat(str, invalidFilesCount);
    }
  });
  return NoValidFilesView;
});