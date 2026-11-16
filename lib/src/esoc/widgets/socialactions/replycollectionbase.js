/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette", "csui/lib/jquery", "csui/utils/connector", "esoc/widgets/socialactions/replycollection.model", "esoc/widgets/socialactions/replycollection.view", "esoc/widgets/socialactions/replyheader.view" ], function(Marionette, $, Connector, ReplyCollectionModel, ReplyCollectionView, ReplyHeaderView) {
  function ReplyCollectionBase(options) {
    var replyRootWidget = $(options.parentNode);
    var replyCollectionModel = new ReplyCollectionModel(options);
    options.model = replyCollectionModel;
    replyCollectionModel.socialActions = options.socialActions;
    replyCollectionModel.options = options;
    var replyHeaderContainerRegion = new Marionette.Region({
      el: options.parentNode
    });
    replyHeaderContainerRegion.show(new ReplyHeaderView(options));
    var replyListRegion = new Marionette.Region({
      el: "#esoc-social-reply-container"
    });
    var replyCollectionView = new ReplyCollectionView({
      context: replyCollectionModel.options.context,
      collection: replyCollectionModel,
      parentCollectionView: options.parentCollectionView,
      commentConfigOptions: options,
      sort: true
    });
    replyListRegion.show(replyCollectionView);
    options.success = replyCollectionModel.fetchSuccess;
    options.error = replyCollectionModel.fetchError;
    replyCollectionModel.fetch(options);
    replyRootWidget.css({
      display: "block"
    });
    replyRootWidget.show();
    replyRootWidget.animate({
      opacity: 1
    });
    this.getConfig = function() {
      return options;
    };
  }
  return ReplyCollectionBase;
});