/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/skip.links/skip.link", "css!smart/controls/skip.links/impl/skip.links" ], function(_, Backbone, Marionette, SkipLinkItemView) {
  var SkipLinksCollectionView = Marionette.CollectionView.extend({
    tagName: "otc-skiplinks",
    template: false,
    className: "smart-otc-skiplinks",
    childView: SkipLinkItemView,
    constructor: function SkipLinksCollectionView(options = {}) {
      let skipLinksArray = options?.skipLinks ?? [];
      this.collection = new Backbone.Collection(skipLinksArray);
      Marionette.CollectionView.call(this, options);
    }
  });
  return SkipLinksCollectionView;
});