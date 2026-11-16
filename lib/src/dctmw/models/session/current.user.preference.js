/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import module from "module";

import {
  Model
} from "nuc/lib/backbone";

import ResourceMixin from "nuc/models/mixins/resource/resource.mixin";

import ServerAdaptorMixin from "dctmw/models/session/cup.server.adaptor";

class CurrentUserPreference extends Model {
  constructor(attr = {}, options = {}) {
    Object.assign(attr, module.config());
    super(attr, options);
    this.makeResource(options).makeServerAdaptor(options);
  }
  isAccessibilityEnabled() {
    return this.get("sv_accessible_compliant") === true;
  }
  getPreferredLanguage() {
    return this.get("default_language");
  }
}

ResourceMixin.mixin(CurrentUserPreference.prototype);

ServerAdaptorMixin.mixin(CurrentUserPreference.prototype);

Object.defineProperty(CurrentUserPreference.prototype.constructor, "name", {
  value: "CurrentUserPreference"
});

export default CurrentUserPreference;