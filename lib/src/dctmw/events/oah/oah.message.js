/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import Backbone from "nuc/lib/backbone";

import eventsConstants from "dctmw/events/oah/events.constants";

class OahMessage extends Backbone.Model {
  setId(sId) {
    this.set(eventsConstants.OAM.PARAM_ID, sId);
    return sId;
  }
  setTargetType(sTarget) {
    this.set(eventsConstants.OAM.PARAM_TARGET_TYPE, sTarget);
    return sTarget;
  }
  setContainerUid(sContainerUid) {
    this.set(eventsConstants.OAM.PARAM_CONTAINER_UID, sContainerUid);
    return sContainerUid;
  }
  toString() {
    var string = "";
    _.each(this.attributes, function(value, key) {
      if (string !== "") {
        string += eventsConstants.OAM.PARAM_SEPARATOR;
      }
      string += key + eventsConstants.OAM.PARAM_EQ + value;
    }.bind(this));
    return string;
  }
  parse(message) {
    try {
      var aString = message.split(eventsConstants.OAM.PARAM_SEPARATOR);
      for (var i = 0; i < aString.length; i++) {
        var aDuo = aString[i].split(eventsConstants.OAM.PARAM_EQ);
        var value = "";
        for (var j = 1; j < aDuo.length; j++) {
          if (j !== 1) value += eventsConstants.OAM.PARAM_EQ;
          value += aDuo[j];
        }
        this.set(aDuo[0], value);
      }
    } catch (exception) {
      console.log("error while parsing message : " + message + " - error:" + exception.message);
    }
  }
}

Object.defineProperty(OahMessage.prototype.constructor, "name", {
  value: "OpenAjaxMessage"
});

export default OahMessage;