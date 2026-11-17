/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/models/command", "csui/utils/commands", "d2/commands/tableview.close", "i18n!d2/commands/nls/localized.strings" ], function(_, CommandModel, commands, CommandTableViewClose, cmdLang) {
  "use strict";
  describe("Command - CloseTableView", function() {
    var cmd;
    beforeEach(function() {
      cmd = new CommandTableViewClose();
    });
    it("is instantiable", function() {
      expect(cmd).toBeDefined();
      expect(cmd instanceof CommandModel).toBeTruthy();
      expect(cmd.get("signature")).toBe("D2-TableViewClose");
      expect(cmd.get("name")).toBe(cmdLang.CommandVDocTableViewClose);
      expect(cmd.get("scope")).toBe("single");
    });
    it("is registered with the VD commands collection", function() {
      var cmd = commands.get("D2-TableViewClose");
      expect(cmd).toBeDefined();
      expect(cmd instanceof CommandTableViewClose).toBeTruthy();
    });
    it("is always enabled", function() {
      expect(cmd.enabled()).toBe(true);
      expect(cmd.enabled({
        nodes: []
      })).toBe(true);
      expect(cmd.enabled({
        nodes: []
      }, {})).toBe(true);
    });
    describe("executes successfully", function() {
      it("without status parameter", function(done) {
        cmd.execute().done(done).fail(done.fail);
      });
      it("without originatingView", function(done) {
        cmd.execute({}).done(done).fail(done.fail);
      });
      it("with originating view by killing embedded dialog instance", function(done) {
        var cmdStatus = {}, killSpy = jasmine.createSpy("kill");
        cmdStatus.originatingView = {
          dialog: {
            kill: killSpy
          }
        };
        cmd.execute(cmdStatus).done(function() {
          expect(cmdStatus.originatingView.dialog.kill).toHaveBeenCalledTimes(1);
          done();
        }).fail(done.fail);
      });
    });
  });
});