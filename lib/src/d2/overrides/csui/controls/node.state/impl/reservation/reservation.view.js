/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/base", "d2/controls/globalmessage/globalmessage", "d2/utils/constants", "hbs!d2/overrides/csui/controls/node.state/impl/reservation/reservation", "i18n!d2/commands/nls/localized.strings", "i18n!d2/overrides/csui/controls/node.state/nls/lang" ], function(require, _, $, base, GlobalMessage, constant, template, lang, reservationLang) {
  "use strict";
  require([ "csui/controls/node.state/impl/reservation/reservation.view" ], function(ReservationView) {
    const origOnRemoveReservation = ReservationView.prototype.onRemoveReservation;
    const origTemplateHelpers = ReservationView.prototype.templateHelpers;
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
      },
      templateHelpers: function() {
        var valueData = origTemplateHelpers.apply(this, arguments);
        var reservedStatus = this._getReservedStatus(), reservedDate = base.formatExactDate(this.model.get("reserved_date"));
        if (reservedStatus?.reservedBy?.id == constant.OES_USER) {
          valueData.reservedTooltip = _.str.sformat(reservationLang.reservedByOESAdmin, reservedDate);
        }
        return valueData;
      }
    });
  });
});