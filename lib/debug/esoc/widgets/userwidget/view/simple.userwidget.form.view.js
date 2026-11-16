csui.define([
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/lib/handlebars',
  'csui/lib/marionette',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'esoc/factory/view.simple.user.factory',
  'esoc/controls/form/view.simple.user.info/view.simple.user.form',
  'hbs!esoc/widgets/userwidget/impl/simple.userwidget.form.view',
  'esoc/widgets/userwidget/model/view.simple.user.form',
  'css!esoc/widgets/userwidget/impl/userwidget.css'
], function ($, _, Backbone, Handlebars, Marionette, PerfectScrollingBehavior, ViewSimpleUserFormFactory,
    ViewSimpleUserFormView, SimpleUserWidgetFormViewTemplate, ViewSimpleUserFormModel) {

  var SimpleUserWidgetFormView = Marionette.ItemView.extend({
    className: 'esoc-simple-user-widget-profile-view',
    template: SimpleUserWidgetFormViewTemplate,
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true,
        contentParent: ".esoc-simple-user-widget-form-view",
        scrollYMarginOffset: 15 // like bottom padding of container, otherwise scrollbar is shown always
      }
    },
    constructor: function SimpleUserWidgetFormView(options) {
      options = options || {};
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.form = options.context.getModel(ViewSimpleUserFormFactory,options);
      if (options.userid !== this.form.get("userId")) {
        this.form = new ViewSimpleUserFormModel({ userId: options.userwidgetmodel.get('id') }, { connector: this.options.connector })
      }
      this.formPromise =  this.form.ensureFetched();
    },

    onRender: function () {
      var self = this;
      this.formPromise.done(function() {
        self.formView = new ViewSimpleUserFormView({
          context: self.options.context,
          orginatingView: self,
          model: self.form
        });
        var formViewRegion = new Marionette.Region({el: self.$el.find('.esoc-simple-user-widget-form-content')});
        formViewRegion.show(self.formView);
      });
    }

  });
  return SimpleUserWidgetFormView;
});