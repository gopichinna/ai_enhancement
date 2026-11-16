/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/node.state/impl/reservation/reservation.view", "csui/controls/node.state/impl/locked/locked.view", "csui/controls/node.state/impl/generation/generation.view" ], function(ReservationIconView, LockedIconView, GenerationIconView) {
  "use strict";
  return [ {
    sequence: 50,
    iconView: ReservationIconView
  }, {
    sequence: 60,
    iconView: LockedIconView
  }, {
    sequence: 70,
    iconView: GenerationIconView
  } ];
});