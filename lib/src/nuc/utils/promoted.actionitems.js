/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/models/actionitems'], function (_, ActionItemCollection) {
  'use strict';

  // There are no actions in Nucleus. The product integrating nucleus is
  // supposed to provide the actions using the module-renaming map.
  // TODO: Remove this module as soon as the actions are passed only via
  /// module constructors.
  return new ActionItemCollection();
});
