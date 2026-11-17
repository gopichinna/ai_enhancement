/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'csui/utils/contexts/factories/connector'
], function(ConnectorFactoryImpl){
  'use strict';

  /**
   * Factory to create/access a `connector` object. A `connector` object acts as an
   * authenticated transport for connecting to D2-REST resources through AJAX apis.
   *
   * D2 Smartview runtime uses a single connector object created through this factory.
   *
   * Such a `connector` can be used standalone with `jQuery` AJAX apis, or it can be set as the
   * transport for a `Backbone.Model` or `Backbone.Collection` instance.
   *
   * @example <caption>To get the active connector instance in any module</caption>
   * define([
   *  'd2/utils/contexts/context.utils',
   *  'd2/utils/contexts/factories/connector'
   * ], function(contextUtils, ConnectorFactory){
   *  'use strict';
   *
   *  var context = contextUtils.getPerspectiveContext(),
   *    connector = context.getObject(ConnectorFactory);
   *
   *  // Do whatever with the connector instance
   * });
   *
   * @module {d2/sdk/utils/contexts/factories/connector} d2/sdk/utils/contexts/factories/connector
   * @name ConnectorFactory
   * @extends external:BaseFactory
   */

  /**
   * @external BaseFactory
   * @see ./factory
   */

  var ConnectorFactory = ConnectorFactoryImpl.extend({
    constructor: function ConnectorFactory(context, options) {
      ConnectorFactory.__super__.constructor.call(this, context, options);
    }
  });

  return ConnectorFactory;
});