/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/lib/marionette',
  'dctmw/utils/authenticators/session'
], function(_, Marionette, SessionImpl){
  'use strict';

  var sessionInstance, implInstance;

  /**
   * Session utility. It is a singleton entity in D2SV runtime, used to check state of D2SV session and avail the authenticated connector instance
   * associated with the session.
   * Can also return a reference to the application state data holder a.k.a context associated with the D2SV runtime.
   *
   * @module {d2/sdk/utils/session} d2/sdk/utils/"session"
   * @name Session
   * @extends external:Marionette.Object
   * @fires module:Session#init
   * @fires module:Session#begin
   * @fires module:Session#end
   */

  /**
   * @external "Marionette.Object"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.object.html
   */

  /**
   * Marks the initialization of a session. The event is emitted when the session has created
   * its pre-requisite objects and it's ready to check authentication status
   * @event module:Session#init
   * @type {string}
   */

  /**
   * Marks the beginning of a session. The event is emitted when session reaches validated state
   * after fresh login or page reload.
   * @event module:Session#begin
   * @type {string}
   */

  /**
   * Marks the end of a session. The event is emitted when session couldn't reach a validated state
   * after page reload or the underlying connection authenticator has detected logout or session expiry.
   * @event module:Session#end
   * @type {string}
   */

  var Session = Marionette.Object.extend({
    constructor: function Session() {
      if(!implInstance) {
        implInstance = SessionImpl.get();
        implInstance.on('all', function(){
          var args = _.filter(arguments, function(arg){
            return arg !== implInstance;
          });
          this.trigger.apply(this, args);
        }.bind(this));
      }
    },

    /**
     * Check if the session is initialized or not. Right after a session object is instantiated, it is put to an un-initialized state.
     * The uninitialized state represents that the session is still setting up context, connector and an appropriate authenticator.
     * @return {Boolean} Whether the session is initialized.
     * @instance
     */
    isInitialized: function() {
      return implInstance.isInitialized();
    },

    /**
     * Checks if the session is active or not. An `initialized` session automatically tries to validate itself against an authenticated
     * connection. If the validation goes through, then the session becomes an `active` session otherwise it stays `inactive` and waits
     * for the end user to login into D2SV.
     * @return {Boolean} Whether the session is active
     * @instance
     */
    isActive: function() {
      return implInstance.isActive();
    },

    /**
     * Get a reference to the application data holder associated with this session. The context can be used to create or access
     * data created by different data factories.
     * @see {@link ./contexts/context.utils#Context|Context}
     * @return {*} Returns the session context.
     * @instance
     *
     * @example <caption>Code sample to get the connector instance inside any module</caption>
     *
     * define([
     *  'd2/sdk/utils/session',
     *  'd2/sdk/utils/contexts/factories/connector',
     *  'd2/sdk/models/node.model'
     * ], function(Session, ConnectorFactory, NodeModel){
     *  'use strict';
     *
     *  var context;
     *
     *  function createNodeModel(attributes) {
     *    if(!context) {
     *      context = Session.get().getContext();
     *    }
     *    return new NodeModel(attributes, {connector: context.getObject(ConnectorFactory)});
     *  }
     *
     *  return {
     *    cteateNodeModel: createNodeModel
     *  };
     * });
     */
    getContext: function() {
      return implInstance.getContext();
    }
  });



  return {
    /**
     * @memberof module:Session
     * @description Get a reference to the singleton instance.
     * @return {Session} Returns the session instance.
     */
    get: function() {
      if(!sessionInstance) {
        sessionInstance = new Session();
      }
      return sessionInstance;
    }
  };
});
