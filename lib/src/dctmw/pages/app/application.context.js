/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "nuc/contexts/context", "csui/models/view.state.model" ], function(_, Marionette, Context, ViewStateModel) {
  "use strict";
  var ApplicationContext = Context.extend({
    constructor: function ApplicationContext(options) {
      options = options || {};
      this.viewStateModel = new ViewStateModel();
      ApplicationContext.__super__.constructor.call(this, options);
    },
    isFetchable: function(factory) {
      var retVal = ApplicationContext.__super__.isFetchable.apply(this, arguments);
      if (retVal === true && this.isFetchableDelegate) {
        retVal = this.isFetchableDelegate(factory);
      }
      return retVal;
    },
    initialize: function() {
      this.listenTo(this, "request", function() {
        this.viewStateModel && this.viewStateModel.onContextFetch();
      });
    },
    _getFactory: function(Factory, options, createIfNotFound) {
      let factory = ApplicationContext.__super__._getFactory.call(this, Factory, _.isUndefined(options) || _.isNull(options) ? options : _.extend({}, options), false);
      if (!factory) {
        if (options?.reuseLastIfNoExactMatch === true) {
          const propPrefix = Factory.propertyPrefix ?? Factory?.prototype?.propertyPrefix;
          if (propPrefix) {
            const ts = Date.now();
            const matches = Object.keys(this._factories).filter(fName => fName.startsWith(propPrefix) && this._factories[fName].__isDestroyed !== true).map(fName => this._factories[fName]).sort((fA, fB) => (fB.created_time || ts) - (fA.created_time || ts));
            if (matches && matches.length) {
              factory = matches[0];
            }
          }
        } else if (createIfNotFound === true) {
          factory = ApplicationContext.__super__._getFactory.call(this, Factory, options, createIfNotFound);
        }
      }
      return factory;
    }
  });
  return ApplicationContext;
});