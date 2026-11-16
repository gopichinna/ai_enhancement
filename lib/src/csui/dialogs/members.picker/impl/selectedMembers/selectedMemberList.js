/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "csui/dialogs/members.picker/impl/selectedMembers/selectedMember", "hbs!csui/dialogs/members.picker/impl/selectedMembers/impl/selectedMemberList", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "css!csui/dialogs/members.picker/impl/selectedMembers/impl/selectedMember" ], function(_, Backbone, Marionette, MemberView, template, LayoutViewEventsPropagationMixin) {
  var SelectedMemberList = Marionette.CollectionView.extend({
    template: template,
    className: "csui-normal-scrolling",
    childView: MemberView,
    childViewContainer: ".csui-selected-member-list",
    childViewOptions: {
      collection: this.collection
    },
    ui: {
      memberListContainer: ".csui-selected-member-list"
    },
    constructor: function SelectedMemberList(options) {
      options || (options = {});
      this.collection = options.collection || new Backbone.Collection();
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "show:selectItem", _.bind(function(selectedMember) {
        this.collection.add(selectedMember);
      }, this));
    },
    onRender: function() {
      this.listenTo(this, "remove:selectItem", _.bind(function(selectedMember) {
        this.collection.remove(selectedMember);
      }, this));
    }
  });
  _.extend(SelectedMemberList.prototype, LayoutViewEventsPropagationMixin);
  return SelectedMemberList;
});