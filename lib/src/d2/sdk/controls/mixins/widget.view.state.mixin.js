/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'dctmw/controls/mixins/view.state/widget.view.state.mixin'
], function(_, ViewStateMixinImpl){
  'use strict';

  /**
   * Mixin to facilitate storage and retrieval of view specific parameters especially for those views that are backed by a widget configuration.
   *
   * To be mixed on the `prototype` of a view.
   *
   * @example
   * define([
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/mixins/widget.view.state.mixin',
   *  'd2/sdk/utils/contexts/context.utils'
   * ], function(Marionette, WidgetViewStateMixin, contextUtil){
   *  'use strict';
   *
   *  var MyView = Marionette.ItemView.extend({
   *    constructor: function MyView(options) {
   *      options = options || {};
   *      this.context = contextUtil.getPerspectiveContext(); //A context reference on self object is required for WidgetViewStateMixin to work.
   *      MyView.__super__.constructor.call(this, options);
   *    },
   *
   *    onRender: function() {
   *      this.$el.text('My widget name is: ' + this.getViewStateWidgetName());
   *    }
   *  });
   *
   *  WidgetViewStateMixin.mixin(MyView.prototype);
   *
   *  var view = new MyView();
   *  view.setViewStateWidgetName('hello world'); //Also, the view itself could call it to set the value
   *
   *  new Marionette.Region({el: '.host-el'}).show(view); //Shows the widget name in view element's text.
   * });
   *
   * @module {d2/sdk/controls/mixins/widget.view.state.mixin} d2/sdk/controls/mixins/"widget.view.state.mixin"
   * @name WidgetViewStateMixin
   * @extends Object
   */

  return {
    /**
     * Mix function from this mixin into supplied prototype.
     * @param {any} prototype - A view prototype.
     * @returns {*} The same prototype
     * @static
     */
    mixin: function(prototype) {
      return _.extend(prototype, {
        /**
         * Set the widget configuration name to be associated with this `widget.view`
         * @function
         * @param {string} widgetName - Stores the supplied value against key `widget-name` in the `ViewStateModel`
         * @returns {void}
         * @memberOf module:WidgetViewStateMixin
         * @instance
         */
        setViewStateWidgetName: ViewStateMixinImpl.setViewStateWidgetName,

        /**
         * Get the widget configuration name associated with this `widget.view`
         * @function
         * @returns {(string|undefined)} previously stored widget name from `ViewStateModel`
         * @memberOf module:WidgetViewStateMixin
         * @instance
         */
        getViewStateWidgetName: ViewStateMixinImpl.getViewStateWidgetName,

        /**
         * Get the initial list of parameters to be serialized/deserialized from the HTML document location
         * @function
         * @returns {string[]} should return name of the parameter to (de)serialize from the HTML page URL
         * @memberOf module:WidgetViewStateMixin
         * @instance
         */
        getInitialUrlParamsList: ViewStateMixinImpl.getInitialUrlParamsList
      });
    }
  };
});
