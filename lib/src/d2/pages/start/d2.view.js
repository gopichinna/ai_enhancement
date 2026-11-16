/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import require from "require";

import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import PerspectiveModuleView from "dctmw/pages/start/perspective.module.view";

class D2View extends PerspectiveModuleView {
  constructor(options = {}) {
    super(options);
  }
  className() {
    const superClassName = super.className.apply(this, arguments);
    return `${superClassName} module-d2-view`;
  }
  initPerspectiveSetup(options) {
    const dfd = $.Deferred();
    require([ "d2/overrides/d2.core.overrides", "d2/overrides/d2.desktop.overrides" ], () => {
      super.initPerspectiveSetup(options).done(dfd.resolve).fail(dfd.reject);
    }, dfd.reject);
    return dfd.promise();
  }
  finalizePerspectiveSetup(options) {
    const dfd = $.Deferred();
    require([ "d2/utils/contexts/context.controller", "d2/ctf/ctfBridge", "d2/ctf/utils", "d2/ctf/wsHandler", "d2/controls/globalmessage/globalmessage", "d2/utils/job.tracker/job.tracker", "d2/commands/dump", "d2/utils/show.dump/dump.keyboard.capture", "dctmw/events/oah/dctm.oah.handler" ], (D2ContextController, ctfBridge, ctfUtils, wshandler, GlobalMessage, JobTracker, DumpCommand, DumpKeyboardCapture, DctmOahHandler) => {
      D2ContextController.init(this.context);
      DctmOahHandler.initialize();
      if (ctfUtils.doCtfHandshake()) {
        let options = {
          wshandler: wshandler,
          context: this.context
        };
        options.failure = function(err) {
          GlobalMessage.showMessage("error", err);
        };
        ctfBridge.init(options);
      }
      if (this.hasNavigationHeader()) {
        this.listenToOnce(this.navigationHeader, "render", () => {
          JobTracker.get({
            context: this.context
          });
        });
      } else {
        JobTracker.get({
          context: this.context
        });
      }
      let dumpCommand = new DumpCommand();
      if (dumpCommand.doesUserHavePermission()) {
        DumpKeyboardCapture.init(this.context);
      }
      super.finalizePerspectiveSetup(options).done(dfd.resolve).fail(dfd.reject);
    }, dfd.reject);
    return dfd.promise();
  }
}

Object.defineProperty(D2View.prototype.constructor, "name", {
  value: "D2View"
});

export default D2View;