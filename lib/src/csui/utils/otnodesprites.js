/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/models/mixins/rules.matching/rules.matching.mixin", "i18n!csui/utils/impl/nls/lang", "csui-ext!csui/utils/nodesprites" ], function(_, Backbone, RulesMatchingMixin, lang, extraIcons) {
  var NodeSpriteModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      className: null
    },
    constructor: function NodeSpriteModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });
  RulesMatchingMixin.mixin(NodeSpriteModel.prototype);
  var NodeSpriteCollection = Backbone.Collection.extend({
    model: NodeSpriteModel,
    comparator: "sequence",
    constructor: function NodeSpriteCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },
    findClass: function(compareType, key, val) {
      var nodeSprite = this.find(function(item) {
        var values = item.get(compareType);
        if (values === undefined) {
          return undefined;
        }
        if (_.isArray(values[key])) {
          var keyValues = values[key];
          for (var i = 0; i < keyValues.length; i++) {
            if (keyValues[i] === val) {
              return true;
            }
          }
        }
        return values[key] === val;
      });
      return nodeSprite ? nodeSprite.get("className") : undefined;
    },
    findTypeByNode: function(node) {
      var typeName = node.get("type_name") || lang.NodeTypeUnknown;
      var nodeSprite = this.findByNode(node);
      if (nodeSprite) {
        var spriteName = _.result(nodeSprite.attributes, "mimeType");
        if (spriteName) {
          typeName = spriteName;
        }
      }
      return typeName;
    },
    findClassByNode: function(node) {
      var nodeSprite = this.findByNode(node);
      return nodeSprite && _.result(nodeSprite.attributes, "className") || "";
    },
    findByNode: function(node) {
      return this.find(function(item) {
        return item.matchRules(node, item.attributes);
      });
    }
  });
  var nodeSprites = new NodeSpriteCollection([ {
    equalsNoCase: {
      mime_type: [ "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.openxmlformats-officedocument.spreadsheetml.template", "application/vnd.ms-excel.sheet.macroEnabled.12", "application/vnd.ms-excel.template.macroEnabled.12", "application/vnd.ms-excel.addin.macroEnabled.12", "application/vnd.ms-excel.sheet.binary.macroEnabled.12" ]
    },
    className: "csui-icon mime_excel",
    iconName: "csui_mime_excel32",
    mimeType: lang.NodeTypeXLS,
    sequence: 50
  }, {
    equalsNoCase: {
      mime_type: [ "application/visio", "application/x-visio", "application/vnd.visio", "application/visio.drawing", "application/vsd", "application/x-vsd", "image/x-vsd", "application/vnd.visio2013", "application/vnd.ms-visio.drawing", "application/vnd.ms-visio.viewer", "application/vnd.ms-visio.stencil", "application/vnd.ms-visio.template" ]
    },
    className: "csui-icon mime_visio",
    iconName: "csui_mime_visio32",
    mimeType: lang.NodeTypeVisio,
    sequence: 50
  }, {
    equalsNoCase: {
      mime_type: [ "application/vnd.oasis.opendocument.spreadsheet", "application/vnd.oasis.opendocument.spreadsheet-template", "application/vnd.sun.xml.calc", "application/vnd.sun.xml.calc.template", "application/vnd.stardivision.calc", "application/x-starcalc" ]
    },
    className: "csui-icon mime_spreadsheet",
    iconName: "csui_mime_spreadsheet32",
    mimeType: lang.NodeTypeSpreadsheet,
    sequence: 50
  }, {
    equalsNoCase: {
      mime_type: [ "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.openxmlformats-officedocument.presentationml.template", "application/vnd.openxmlformats-officedocument.presentationml.slideshow", "application/vnd.ms-powerpoint.addin.macroEnabled.12", "application/vnd.ms-powerpoint.presentation.macroEnabled.12", "application/vnd.ms-powerpoint.template.macroEnabled.12", "application/vnd.ms-powerpoint.slideshow.macroEnabled.12" ]
    },
    className: "csui-icon mime_powerpoint",
    iconName: "csui_mime_powerpoint32",
    mimeType: lang.NodeTypePPT,
    sequence: 50
  }, {
    equalsNoCase: {
      mime_type: [ "application/vnd.google-apps.presentation", "application/x-iwork-keynote-sffkey", "application/vnd.wolfram.mathematica", "application/vnd.wolfram.player", "application/vnd.oasis.opendocument.presentation", "application/vnd.oasis.opendocument.presentation-template", "application/vnd.sun.xml.impress", "application/vnd.sun.xml.impress.template", "application/vnd.stardivision.impress", "application/vnd.stardivision.impress-packed", "application/x-starimpress", "application/vnd.lotus-freelance", "application/vnd.stardivision.impress", "application/vnd.corel-presentations", "application/vnd.sun.xml.impress", "application/vnd.ms-officetheme", "application/vnd.sun.xml.impress.template " ]
    },
    className: "csui-icon mime_presentation",
    iconName: "csui_mime_presentation32",
    mimeType: lang.NodeTypePresentation,
    sequence: 50
  }, {
    equalsNoCase: {
      mime_type: [ "application/vnd.ms-publisher", "application/x-mspublisher" ]
    },
    className: "csui-icon mime_publisher",
    iconName: "csui_mime_publisher32",
    mimeType: lang.NodeTypePublisher,
    sequence: 50
  }, {
    equalsNoCase: {
      mime_type: [ "application/vnd.oasis.opendocument.formula", "application/vnd.sun.xml.math", "application/vnd.stardivision.math", "application/x-starmath" ]
    },
    className: "csui-icon mime_formula",
    iconName: "csui_mime_formula32",
    mimeType: lang.NodeTypeFormula,
    sequence: 50
  }, {
    equalsNoCase: {
      mime_type: [ "application/vnd.pdf", "application/x-pdf", "application/pdf" ]
    },
    className: "csui-icon mime_pdf",
    iconName: "csui_mime_pdf32",
    mimeType: lang.NodeTypePDF,
    sequence: 50
  }, {
    equalsNoCase: {
      mime_type: [ "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.wordprocessingml.template", "application/vnd.ms-word.document.macroEnabled.12", "application/vnd.ms-word.template.macroEnabled.12" ]
    },
    className: "csui-icon mime_word",
    iconName: "csui_mime_word32",
    mimeType: lang.NodeTypeDOC,
    sequence: 50
  }, {
    equalsNoCase: {
      mime_type: [ "application/dwg", "drawing/dwg" ]
    },
    className: "csui-icon mime_dwg",
    iconName: "csui_mime_dwg32",
    mimeType: lang.NodeTypeDWG,
    sequence: 50
  }, {
    equalsNoCase: {
      mime_type: [ "application/onenote", "application/msonenote" ]
    },
    className: "csui-icon mime_onenote",
    iconName: "csui_mime_onenote32",
    mimeType: lang.NodeTypeONE,
    sequence: 50
  }, {
    equalsNoCase: {
      mime_type: [ "application/vnd.ms-project", "application/msproj", "application/msproject", "application/x-msproject", "application/x-ms-project", "application/mpp" ]
    },
    className: "csui-icon mime_project",
    iconName: "csui_mime_project32",
    mimeType: lang.NodeTypeMPP,
    sequence: 50
  }, {
    startsWithNoCase: {
      mime_type: "image/"
    },
    className: "csui-icon mime_image",
    iconName: "csui_mime_image32",
    mimeType: lang.NodeTypeImage,
    sequence: 50
  }, {
    startsWithNoCase: {
      mime_type: "audio/"
    },
    className: "csui-icon mime_audio",
    iconName: "csui_mime_audio32",
    mimeType: lang.NodeTypeAudio,
    sequence: 50
  }, {
    startsWithNoCase: {
      mime_type: "text/"
    },
    className: "csui-icon mime_paper",
    iconName: "csui_mime_paper32",
    mimeType: lang.NodeTypeText,
    sequence: 50
  }, {
    equalsNoCase: {
      mime_type: "text/html"
    },
    className: "csui-icon mime_html",
    iconName: "csui_mime_html32",
    mimeType: lang.NodeTypeHtml,
    sequence: 40
  }, {
    startsWithNoCase: {
      mime_type: "video/"
    },
    className: "csui-icon mime_video",
    iconName: "csui_mime_video32",
    mimeType: lang.NodeTypeVideo,
    sequence: 50
  }, {
    equalsNoCase: {
      mime_type: [ "application/x-rar-compressed", "application/zip", "application/x-zip", "application/x-zip-compressed" ]
    },
    className: "csui-icon mime_zip",
    iconName: "csui_mime_zip32",
    mimeType: lang.NodeTypeCompressed,
    sequence: 50
  }, {
    equals: {
      type: 144
    },
    className: "csui-icon mime_document",
    iconName: "csui_mime_document32",
    sequence: 100
  }, {
    equals: {
      type: 736
    },
    className: "csui-icon mime_drawing",
    iconName: "csui_mime_drawing32",
    sequence: 100
  }, {
    equals: {
      type: 258
    },
    className: "csui-icon csui-icon-saved-search-query",
    iconName: "csui_mime_saved_search32",
    mimeType: lang.NodeTypeSearchQuery,
    sequence: 100
  }, {
    equals: {
      type: 292
    },
    className: "csui-icon csui-icon-query-form-search",
    iconName: "csui_mime_query_form_search32",
    mimeType: lang.NodeTypeSearchForm,
    sequence: 100
  }, {
    equals: {
      type: 140
    },
    className: "csui-icon url1",
    iconName: "csui_mime_url32",
    mimeType: lang.NodeTypeURL,
    sequence: 100
  }, {
    equals: {
      type: 1
    },
    className: "csui-icon shortcut1",
    iconName: "csui_mime_shortcut32",
    withColorSchemaIconName: "csui_colorschema_mime_shortcut",
    sequence: 100
  }, {
    equals: {
      type: 2
    },
    className: "csui-icon generation1",
    iconName: "csui_mime_generation32",
    sequence: 100
  }, {
    equals: {
      type: 131
    },
    className: "csui-icon category1",
    iconName: "csui_mime_category32",
    sequence: 100
  }, {
    equals: {
      type: 202
    },
    className: "csui-icon csui-icon-project",
    iconName: "csui_mime_cs_project32",
    withColorSchemaIconName: "csui_colorschema_mime_cs_project",
    sequence: 100
  }, {
    equals: {
      type: 298
    },
    className: "csui-icon collection",
    iconName: "csui_mime_collection32",
    withColorSchemaIconName: "csui_colorschema_mime_collection",
    sequence: 100
  }, {
    equals: {
      type: 141
    },
    className: "csui-icon csui-icon-enterprise-volume",
    iconName: "csui_mime_enterprise32",
    sequence: 100
  }, {
    equals: {
      type: 142
    },
    className: "csui-icon csui-icon-personal-volume",
    iconName: "csui_mime_enterprise32",
    sequence: 100
  }, {
    equals: {
      type: 133
    },
    className: "csui-icon csui-icon-category-volume",
    iconName: "csui_mime_category_volume32",
    sequence: 100
  }, {
    equals: {
      type: 132
    },
    className: "csui-icon csui-icon-node-category-folder",
    iconName: "csui_mime_category_volume32",
    sequence: 100
  }, {
    equals: {
      type: 299
    },
    className: "csui-icon csui-icon-node-livereport",
    iconName: "csui_mime_livereport32",
    withColorSchemaIconName: "csui_colorschema_mime_livereport",
    sequence: 100
  }, {
    equals: {
      type: 212
    },
    className: "csui-icon csui-icon-node-milestone",
    iconName: "csui_mime_milestone32",
    sequence: 100
  }, {
    equals: {
      type: 218
    },
    className: "csui-icon csui-icon-node-poll",
    iconName: "csui_mime_poll32",
    sequence: 100
  }, {
    equals: {
      type: 384
    },
    className: "csui-icon csui-icon-node-prospector",
    iconName: "csui_mime_prospector32",
    sequence: 100
  }, {
    equals: {
      type: 206
    },
    className: "csui-icon csui-icon-node-task",
    iconName: "csui_mime_task32",
    sequence: 100
  }, {
    equals: {
      type: 205
    },
    className: "csui-icon csui-icon-node-task-group",
    iconName: "csui_mime_task_group32",
    sequence: 100
  }, {
    equals: {
      type: 204
    },
    className: "csui-icon csui-icon-node-task-list",
    iconName: "csui_mime_task_list32",
    withColorSchemaIconName: "csui_colorschema_mime_task_list",
    sequence: 100
  }, {
    equals: {
      type: 957
    },
    className: "csui-icon csui-icon-perspective",
    iconName: "csui_mime_perspective32",
    sequence: 100
  }, {
    equals: {
      type: 958
    },
    className: "csui-icon csui-icon-rule",
    iconName: "csui_mime_rule32",
    sequence: 100
  }, {
    equals: {
      type: 955
    },
    className: "csui-icon csui-icon-perspective-assets-folder",
    iconName: "csui_mime_perspective_assets_folder32",
    sequence: 100
  }, {
    equals: {
      type: 954
    },
    className: "csui-icon csui-icon-perspective-assets-volume",
    iconName: "csui_mime_perspective_assets_volume32",
    sequence: 100
  }, {
    equals: {
      type: 899
    },
    className: "csui-icon csui-icon-node-virtual-folder",
    iconName: "csui_mime_virtual_folder32",
    withColorSchemaIconName: "csui_colorschema_mime_virtual_folder",
    sequence: 100
  }, {
    equals: {
      type: 146
    },
    className: "csui-icon mime_custom_view",
    iconName: "csui_mime_custom_view32",
    sequence: 30
  }, {
    equals: {
      type: 153
    },
    className: "csui-icon assignment-workflow",
    iconName: "csui_mime_assignment_workflow32",
    sequence: 100
  }, {
    equals: {
      type: 128
    },
    className: "csui-icon mime_workflow_map",
    iconName: "csui_mime_workflow_map32",
    withColorSchemaIconName: "csui_colorschema_mime_workflow_map",
    sequence: 100
  }, {
    equals: {
      type: 190
    },
    className: "csui-icon mime_workflow_status",
    iconName: "csui_mime_workflow_status32",
    withColorSchemaIconName: "csui_colorschema_mime_workflow_status",
    sequence: 100
  }, {
    equals: {
      type: 207
    },
    className: "csui-icon mime_channel",
    iconName: "csui_mime_channel32",
    withColorSchemaIconName: "csui_colorschema_mime_channel",
    sequence: 100
  }, {
    equals: {
      type: 208
    },
    className: "csui-icon mime_news",
    iconName: "csui_mime_news_item32",
    sequence: 100
  }, {
    equals: {
      type: 215
    },
    className: "csui-icon mime_discussion",
    iconName: "csui_mime_conversation32",
    sequence: 100
  }, {
    equals: {
      type: 335
    },
    className: "csui-icon mime_xml_dtd",
    iconName: "csui_mime_xml32",
    withColorSchemaIconName: "csui_colorschema_mime_xml",
    sequence: 30
  }, {
    equals: {
      type: 223
    },
    className: "csui-icon mime_form",
    iconName: "csui_mime_form32",
    withColorSchemaIconName: "csui_colorschema_mime_form",
    sequence: 100
  }, {
    equals: {
      type: 230
    },
    className: "csui-icon mime_form_template",
    iconName: "csui_mime_layout_template32",
    withColorSchemaIconName: "csui_colorschema_mime_layout_template",
    sequence: 100
  }, {
    equals: {
      type: 1281
    },
    className: "csui-icon icon-pulse-comment",
    iconName: "csui_mime_pulse_comment32",
    sequence: 100
  }, {
    equals: {
      type: 5574
    },
    className: "csui-icon mime_wiki_page",
    iconName: "csui_mime_wiki_page32",
    sequence: 10
  }, {
    equals: {
      type: 5573
    },
    className: "csui-icon mime_wiki",
    iconName: "csui_mime_wiki32",
    withColorSchemaIconName: "csui_colorschema_mime_wiki",
    sequence: 10
  }, {
    equals: {
      container: "nonselectable"
    },
    className: "csui-icon mime_folder_nonselectable",
    iconName: "csui_mime_folder_nonselectable32",
    sequence: 1e3
  }, {
    equals: {
      container: true
    },
    className: "csui-icon mime_folder",
    iconName: "csui_mime_folder32",
    withColorSchemaIconName: "csui_colorschema_mime_folder",
    sequence: 1e3
  }, {
    equals: {
      type: 901
    },
    className: "csui-icon mime_facets_volume",
    iconName: "csui_mime_facets_volume32",
    sequence: 100
  }, {
    equals: {
      type: 902
    },
    className: "csui-icon csui-icon-custom-column",
    iconName: "csui_mime_custom_column32",
    sequence: 100
  }, {
    equals: {
      type: 903
    },
    className: "csui-icon mime_facets_tree",
    iconName: "csui_mime_facets_tree32",
    sequence: 100
  }, {
    equals: {
      type: 904
    },
    className: "csui-icon mime_facets",
    iconName: "csui_mime_facets32",
    sequence: 100
  }, {
    className: "csui-icon mime_document",
    iconName: "csui_mime_document32",
    sequence: 1e4
  }, {
    startsWithNoCase: {
      mime_type: "application/sdd"
    },
    className: "csui-icon mime_application",
    iconName: "csui_mime_application32",
    mimeType: lang.NodeTypeSDD,
    sequence: 50
  }, {
    equals: {
      type: 1309
    },
    className: "csui-icon csui-icon-perspective-assets-volume",
    iconName: "csui_mime_perspective_assets_volume32",
    sequence: 100
  }, {
    equals: {
      type: 1308
    },
    className: "csui-icon csui-icon-support-assets-folder",
    iconName: "csui_mime_support_assets_folder32",
    sequence: 1e4
  }, {
    equals: {
      type: 1307
    },
    className: "csui-icon csui-icon-support-assets-document",
    iconName: "csui_mime_support_assets_document32",
    sequence: 1e4
  }, {
    equals: {
      type: 1306
    },
    className: "csui-icon csui-icon-support-assets-image-folder",
    iconName: "csui_mime_support_assets_image_folder32",
    sequence: 1e4
  }, {
    equals: {
      type: 1305
    },
    className: "csui-icon csui-icon-support-assets-image",
    iconName: "csui_mime_support_assets_image32",
    sequence: 1e4
  } ]);
  if (extraIcons) {
    nodeSprites.add(_.flatten(extraIcons, true));
  }
  return nodeSprites;
});