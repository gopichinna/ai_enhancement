/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/utils/rule.matcher.collection", "d2/sdk/widgets/shortcut.tile/shortcut.tile.behaviors", "d2/utils/widget.constants", "d2/widgets/shortcut/impl/doclist.shortcut.behavior", "d2/widgets/shortcut/impl/url.shortcut.behavior", "d2/widgets/shortcut/impl/workflows.shortcut.behavior", "d2/widgets/shortcut/impl/query.form.shortcut.behavior", "d2/widgets/shortcut/impl/query.shortcut.behavior", "d2/widgets/shortcut/impl/create.file.shortcut.behavior", "d2/widgets/shortcut/impl/upload.file.shortcut.behavior", "d2/widgets/shortcut/impl/create.and.upload.shortcut.behavior", "d2/widgets/shortcut/impl/upload.folder.shortcut.behavior", "d2/widgets/admin/aviator.config/aviator.config.shortcut.behavior", "d2/widgets/admin/mip.config/mip.config.shortcut.behavior" ], function(_, RuleMatcherCollection, sdkShortcutBehaviors, widgetConstants, DoclistShortcutBehavior, URLShortcutBehavior, WorkflowsShortcutBehavior, QueryFormShortcutBehavior, QueryShortcutBehavior, CreateFileShortcutBehavior, UploadFileShortcutBehavior, CreateAndUploadShortcutBehavior, UploadFolderShortcutBehavior, AviatorConfigShortcutBehavior, MipConfigShortcutBehavior) {
  "use strict";
  var RuleMatcherModel = RuleMatcherCollection.prototype.model;
  var ShortcutBehaviorModel = RuleMatcherModel.extend({
    defaults: {
      type: "Unknown",
      sequence: 1e3,
      behaviorClass: undefined
    },
    constructor: function TileModel() {
      RuleMatcherModel.apply(this, arguments);
    },
    getBehaviorClass: function() {
      return this.get("behaviorClass");
    }
  });
  var ShortcutBehaviorCollection = RuleMatcherCollection.extend({
    model: ShortcutBehaviorModel,
    comparator: "sequence",
    findByType: function(type) {
      return this.findByRule({
        equals: {
          type: type
        }
      });
    },
    findByOptions: function(options) {
      options = options || {};
      return this.findByType(options.type);
    }
  });
  var shortcutBehaviors = new ShortcutBehaviorCollection([ {
    type: "CreateFile",
    behaviorClass: CreateFileShortcutBehavior
  }, {
    type: "UploadFile",
    behaviorClass: UploadFileShortcutBehavior
  }, {
    type: "CreateUploadFile",
    behaviorClass: CreateAndUploadShortcutBehavior
  }, {
    type: "UploadFolder",
    behaviorClass: UploadFolderShortcutBehavior
  }, {
    type: "QueryFormObject",
    behaviorClass: QueryFormShortcutBehavior
  }, {
    type: "QueryObject",
    behaviorClass: QueryShortcutBehavior
  }, {
    type: widgetConstants.D2.DOCLIST,
    behaviorClass: DoclistShortcutBehavior
  }, {
    type: widgetConstants.D2.OPENURL,
    behaviorClass: URLShortcutBehavior
  }, {
    type: widgetConstants.D2.WORKFLOWS,
    behaviorClass: WorkflowsShortcutBehavior
  }, {
    type: widgetConstants.D2.ADMIN_AVIATOR,
    behaviorClass: AviatorConfigShortcutBehavior
  }, {
    type: widgetConstants.D2.ADMIN_MIP,
    behaviorClass: MipConfigShortcutBehavior
  } ]);
  if (_.isArray(sdkShortcutBehaviors)) {
    shortcutBehaviors.add(sdkShortcutBehaviors);
  }
  return shortcutBehaviors;
});