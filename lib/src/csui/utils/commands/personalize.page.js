/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/backbone", "nuc/lib/jquery", "csui/models/command", "csui/models/perspective/personalize/personalization.collection", "csui/utils/perspective/perspective.util", "csui/utils/contexts/factories/connector", "csui/controls/perspective.actions/personalization.toolbaritems", "csui/utils/commonconfig.util", "i18n!csui/utils/commands/nls/localized.strings" ], function(require, Backbone, $, CommandModel, PersonalizationCollection, PerspectiveUtil, ConnectorFactory, personalizationToolbarItems, CommonConfigUtil, lang) {
  "use strict";
  let PersonalizePageCommand = CommandModel.extend({
    defaults: {
      signature: "PersonalizePage"
    },
    enabled: function(status, options) {
      const isEnabled = CommandModel.prototype.enabled.call(this, undefined, {
        supressCommandKeyValidation: true
      });
      if (!isEnabled) {
        return false;
      }
      const enableSideBar = CommonConfigUtil.enableSideBar();
      const context = status.context || options && options.context;
      const applicationScope = context._applicationScope.get("id");
      return !applicationScope && !!enableSideBar && context.perspective?.has("id");
    },
    execute: function(status, options) {
      const context = status.context || options && options.context;
      var deferred = $.Deferred();
      this._doPersonalizePage(context, deferred);
      deferred.then(function(pmanView) {
        pmanView && pmanView.render();
      });
      return deferred.promise();
    },
    _doPersonalizePage: async function(context, deferred) {
      let perspective;
      let pModel;
      const collection = new PersonalizationCollection({
        connector: context.getObject(ConnectorFactory),
        removeUnsupportedPagesForPersonalization: true
      });
      await collection.fetch();
      if (PerspectiveUtil.canPersonalizePage(context.perspective.get("type"))) {
        perspective = context.perspective.toJSON();
        let modelOptions = {};
        modelOptions.perspective = perspective;
        pModel = new Backbone.Model(modelOptions);
      } else {
        perspective = collection.findWhere(function(model) {
          return PerspectiveUtil.canPersonalizePage(model.get("type"));
        });
        if (!perspective) {
          const modalAlert = await require("csui/dialogs/modal.alert/modal.alert");
          modalAlert.showError(lang.personalizationError, lang.error);
          deferred.reject();
          return;
        }
        pModel = await this._fetchPerspective(context, perspective, true);
        perspective = pModel.get("perspective");
        perspective.id = pModel.get("av_id");
        pModel.set("perspective", perspective, {
          silent: true
        });
      }
      require([ "csui/perspective.manage/landing.page.pman.view", "csui/models/perspective/personalization.model" ], function(PManView, PersonalizationModel) {
        let currentPerspective = pModel.get("perspective");
        const keysToPick = [ "type", "options", "perspective_version", "perspective_id" ];
        let modelOptions = {};
        Object.keys(currentPerspective).map(function(key) {
          if (keysToPick.includes(key)) modelOptions[key] = currentPerspective[key];
        });
        modelOptions.perspective_id = currentPerspective.id || pModel.get("av_id");
        let personalization = new PersonalizationModel({}, {
          sourceModel: pModel,
          perspective: currentPerspective
        });
        personalization.setPerspective(modelOptions, {
          silent: true
        });
        PersonalizationModel.loadPersonalization(pModel, context).then(function(result) {
          if (!!result) {
            personalization.setPerspective(result, {
              silent: true
            });
          }
          let pmanView = new PManView({
            context: context,
            perspective: personalization,
            mode: PerspectiveUtil.MODE_PERSONALIZE,
            body: "personalizedData",
            requestUrl: "perspectives/save/personalizations",
            collection: collection,
            dropdownItems: personalizationToolbarItems
          });
          deferred.resolve(pmanView);
        });
      }, deferred.reject);
    }
  });
  return PersonalizePageCommand;
});