/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/lib/marionette3", "csui/models/perspective/perspective.template.model", "csui/utils/contexts/factories/connector", "hbs!csui/perspective.manage/impl/top.ribbon/top.ribbon.item" ], function(Backbone, Marionette, PerspectiveTemplateModel, ConnectorFactory, TopRibbonTemplate) {
  "use strict";
  let TopRibbonItemView = Marionette.View.extend({
    className: "csui-top-ribbon-item",
    template: TopRibbonTemplate,
    tagName: "li",
    templateContext: function() {
      return {
        name: this.options.model.get("title"),
        layout: this.options.model.get("perspective").type
      };
    },
    events: {
      "click .csui-top-ribbon-layout": "updatePerspective"
    },
    constructor: function TopRibbonItemView(options = {}) {
      this.options = options;
      Marionette.View.prototype.constructor.call(this, options);
    },
    updatePerspective: async function() {
      const perspectiveId = this.options.model.get("av_id");
      const context = this.options.originatingView.context;
      let perspectiveModel;
      if (this.options.model.get("hasOnlybasicPerspectiveInfo")) {
        this.options.model = new Backbone.Model(await this.fetchPerspective(perspectiveId));
      }
      if (this.options.model.has("perspective")) {
        let perspectiveConfig = this.options.model.get("perspective");
        perspectiveConfig.options.perspectiveMode = this.options.originatingView.mode;
        perspectiveModel = new Backbone.Model(perspectiveConfig);
        perspectiveModel && context.triggerMethod("enter:edit:perspective", perspectiveModel);
      }
    },
    fetchPerspective: async function(perspectiveId) {
      const perspectiveTemplate = new PerspectiveTemplateModel({
        id: perspectiveId
      }, {
        connector: this.options.originatingView.context.getObject(ConnectorFactory)
      });
      const model = await perspectiveTemplate.fetch();
      if (model?.perspectives.length) {
        return model.perspectives[0];
      }
    }
  });
  return TopRibbonItemView;
});