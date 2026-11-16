/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "d2/controls/globalmessage/globalmessage", "hbs!d2/overrides/csui/controls/node.state/impl/reservation/reservation", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, GlobalMessage, template, lang) {
  "use strict";
  require([ "csui/controls/node.state/impl/reservation/reservation.view" ], function(ReservationView) {
    const origOnRemoveReservation = ReservationView.prototype.onRemoveReservation;
    _.extend(ReservationView.prototype, {
      template: template,
      onRemoveReservation: function(event) {
        const checkReservationAction = () => {
          var node = this.model, lazyActionsRetrieved = !!node.get("csuiLazyActionsRetrieved");
          if (node.actions.findWhere({
            signature: "UnreserveDoc"
          }) || lazyActionsRetrieved) {
            return $.Deferred().resolve();
          } else {
            return node.setEnabledLazyActionCommands(true);
          }
        };
        checkReservationAction().always(() => {
          const reservedStatus = this._getReservedStatus();
          this._reservedStatus.canUnreserve = reservedStatus.canUnreserve;
          if (this._reservedStatus.canUnreserve) {
            origOnRemoveReservation.call(this, event);
          } else {
            GlobalMessage.showMessage("error", lang.UnreserveActionNotFoundError);
          }
        });
      }
    });
  });
});