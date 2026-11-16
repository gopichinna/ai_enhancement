/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/models/perspective/personalize/delta.generator", "csui/models/perspective/personalize/delta.resolver" ], function(module, DeltaGenerator, DeltaResolver) {
  var PersonalizeGuide = {
    getDelta: function(perspective, personalization) {
      var generator = new DeltaGenerator({
        perspective: perspective,
        personalization: personalization
      });
      return generator.getDelta();
    },
    getPersonalization: function(perspective, delta) {
      var merger = new DeltaResolver({
        perspective: perspective,
        delta: delta
      });
      return merger.getPersonalization();
    }
  };
  return PersonalizeGuide;
});