/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/underscore", "csui/lib/jquery", "csui/utils/commands/edit.perspective", "csui/models/perspective/perspective.collection/perspective.collection", "csui/models/perspective/perspective.model", "csui/utils/contexts/factories/connector", "csui/controls/perspective.actions/perspective.toolbaritems", "csui/utils/commonconfig.util", "csui/utils/url" ], function(require, _, $, EditPerspective, PerspectiveCollection, PerspectiveModel, ConnectorFactory, perspectiveToolbarItems, CommonConfigUtil, Url) {
  "use strict";
  var EditMultiplePerspectives = EditPerspective.extend({
    defaults: {
      signature: "EditMultiplePerspectives"
    },
    enabled: function(status, options) {
      const enableSideBar = CommonConfigUtil.enableSideBar();
      const context = status.context || options && options.context;
      const perspective = context.perspective;
      const applicationScope = context._applicationScope.get("id");
      return !applicationScope && !!enableSideBar && perspective.get("canEditPerspective");
    },
    execute: function(status, options) {
      const deferred = $.Deferred();
      const context = status.context || options && options.context;
      this._doEditPage(status, options, context, deferred);
      const self = this;
      deferred.then(function(pmanView) {
        pmanView && pmanView.render();
        self._getRuleNames(context, pmanView);
      });
      return deferred.promise();
    },
    _getRuleNames: async function(context, pmanView) {
      const connector = context.getObject(ConnectorFactory);
      try {
        const res = await connector.makeAjaxCall({
          type: "GET",
          url: Url.combine(connector.getConnectionUrl().getApiBase("v1"), "perspectives")
        });
        const rules = res.perspectives[0].available_rules;
        if (rules?.length) {
          pmanView.availableRules = {};
          rules.forEach(item => pmanView.availableRules[item.name] = item.label);
        }
      } catch (err) {
        console.error(err);
      }
    },
    _doEditPage: async function(status, options, context, deferred) {
      let extraoptions = {
        body: "pData",
        requestUrl: "perspectives/save",
        dropdownItems: perspectiveToolbarItems
      };
      extraoptions.collection = new PerspectiveCollection({
        connector: context.getObject(ConnectorFactory)
      });
      await extraoptions.collection.fetch();
      if (context.perspective.has("id")) {
        try {
          let perspectiveModel = await this._fetchPerspective(context, context.perspective);
          if (perspectiveModel) {
            await this._editInline(perspectiveModel, context, deferred, extraoptions);
          }
        } catch (err) {
          deferred.reject();
        }
      } else if (this._enableCreatePerspective(context.perspective, context)) {
        this._createInline(context, deferred, extraoptions);
      }
    },
    _editInline: function(perspectiveModel, context, deferred, extraOptions = {}) {
      require([ "csui/perspective.manage/landing.page.pman.view" ], function(PManView) {
        let perspectiveId = context.perspective.get("id") || context.perspective.get("perspective_id");
        perspectiveModel.set("id", perspectiveId);
        let pmanView = new PManView(Object.assign({
          context: context,
          perspective: perspectiveModel
        }, extraOptions));
        deferred.resolve(pmanView);
      }, deferred.reject);
    },
    _createInline: function(context, deferred, extraOptions = {}) {
      var self = this;
      require([ "csui/utils/contexts/factories/node", "csui/utils/contexts/factories/connector", "csui/utils/contexts/factories/ancestors", "csui/perspective.manage/landing.page.pman.view" ], function(NodeModelFactory, ConnectorFactory, AncestorCollectionFactory, PManView) {
        let perspectiveConfig = self._preparePerspectiveConfig(context, NodeModelFactory, AncestorCollectionFactory);
        let perspective = new PerspectiveModel(perspectiveConfig, {
          connector: context.getObject(ConnectorFactory)
        });
        let pmanView = new PManView(Object.assign({
          context: context,
          perspective: perspective
        }, extraOptions));
        deferred.resolve(pmanView);
      }, deferred.reject);
    }
  });
  return EditMultiplePerspectives;
});