/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/alpaca/js/alpaca.lite" ], function(Alpaca) {
  Alpaca.compileValidationContext = function(field, callback, memo = {}) {
    var chain = [];
    var parent = field;
    do {
      if (!parent.isValidationParticipant()) {
        parent = null;
      }
      if (parent) {
        chain.push(parent);
      }
      if (parent) {
        parent = parent.parent;
      }
    } while (parent);
    chain.reverse();
    var context = [];
    var f = function(chain, context, done) {
      if (!chain || chain.length === 0) {
        done();
        return;
      }
      var current = chain[0];
      var entry = {};
      entry.id = current.getId();
      entry.field = current;
      entry.path = current.path;
      var beforeStatus = current.isValid();
      if (current.isContainer()) {
        beforeStatus = current.isValid(true);
      }
      entry.before = beforeStatus;
      var ourselvesHandler = function(current, entry, weFinished) {
        if (memo[current.id]) {
          context.push(memo[current.id]);
          weFinished();
          return;
        }
        var previouslyValidated = current._previouslyValidated;
        current.validate();
        current._validateCustomValidator(function() {
          var afterStatus = current.isValid();
          if (current.isContainer()) {
            afterStatus = current.isValid(true);
          }
          entry.after = afterStatus;
          entry.validated = false;
          entry.invalidated = false;
          if (!beforeStatus && afterStatus) {
            entry.validated = true;
          } else if (beforeStatus && !afterStatus) {
            entry.invalidated = true;
          } else if (!previouslyValidated && !afterStatus) {
            entry.invalidated = true;
          }
          entry.container = current.isContainer();
          entry.valid = entry.after;
          context.push(entry);
          memo[current.id] = entry;
          weFinished();
        });
      };
      if (chain.length > 1) {
        var childChain = chain.slice(0);
        childChain.shift();
        f(childChain, context, function() {
          ourselvesHandler(current, entry, function() {
            done();
          });
        });
      } else {
        ourselvesHandler(current, entry, function() {
          done();
        });
      }
    };
    f(chain, context, function() {
      callback(context);
    });
  };
});