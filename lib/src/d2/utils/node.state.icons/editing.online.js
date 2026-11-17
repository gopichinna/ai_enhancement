/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import RestResources from "dctmw/utils/rest.resources";

export default class EditingOnline {
  static enabled() {
    return RestResources.getD2Options() && RestResources.getD2Options().oes_enabled === true;
  }
  static getData() {
    return $.Deferred().resolve([]).promise();
  }
}