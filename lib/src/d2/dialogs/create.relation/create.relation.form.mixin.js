/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/utils/rest.resources", "d2/utils/content.assist", "i18n!d2/dialogs/create.relation/impl/nls/lang" ], function(_, RestResources, ContentAssist, lang) {
  "use strict";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        _init: function() {
          var options = this.options;
          this.context = options.context;
          this.parent = options.container;
          this.container = options.container;
          this.node = options.node;
          this.connector = options.connector;
          this.configRelationTypes = [];
          if (this.options.container && this.options.container.get("id")) {
            this._container = this.options.container.get("id");
          }
          this.typesData = RestResources.getDctmTypeData().superTypes;
          this.supportedTypes = this.findTypesWithAncestors(this.node.get("rObjectType") || this.node.get("r_object_type"));
          var me = this;
          _.each(options.relationTypes, function(relation) {
            var prop = relation.content.properties;
            if (me.supportedTypes.includes(prop["parent_type"]) || me.supportedTypes.includes(prop["child_type"])) {
              me.configRelationTypes.push(relation);
            }
          });
          this.isCreateButtonDisabled = true;
          this.reverseRelation = false;
          this.relationTypeSelected = false;
          this.relationChildrenSelected = false;
        },
        findTypesWithAncestors: function(typeName) {
          let returnList = [];
          while (typeName !== undefined) {
            returnList.push(typeName);
            typeName = this.typesData[typeName];
          }
          return returnList;
        },
        findTypeAndSubTypes: function(typeName) {
          let returnList = [];
          if (RestResources.getDctmTypeData().subTypes[typeName]) {
            returnList = RestResources.getDctmTypeData().subTypes[typeName];
          }
          returnList.push(typeName);
          return returnList;
        },
        getContentAssistOptions: function(NodePicker, deferred) {
          var me = this;
          me.container.ensureFetched().done(function() {
            ContentAssist.getContentAssistOptions(me.options).done(function(config) {
              if (!_.isEmpty(config)) {
                me.setContentAssistOptions(config.properties.has_browse_assist, config.properties.has_favorites_assist, config.properties.has_search_assist);
              } else {
                me.setContentAssistOptions(true, false, false);
              }
              me.displayContentAssist(NodePicker, deferred);
            }).fail(deferred.reject);
          }).fail(deferred.reject);
        },
        setContentAssistOptions: function(includeBrowse, includeFavorites, globalSearch) {
          this.options.includeBrowse = includeBrowse;
          this.options.includeFavorites = includeFavorites;
          this.options.globalSearch = globalSearch;
          if (!this.options.includeBrowse && !this.options.includeFavorites && !this.options.globalSearch) {
            this.options.includeBrowse = true;
          }
        },
        createPickerOptions: function() {
          var pickerOptions = {
            dialogTitle: lang.DialogueTitle,
            connector: this.connector,
            container: this.container,
            initialContainer: this.container,
            context: this.options.context,
            selectMultiple: this.selectedRelationModel.get("isMultiRelation"),
            globalSearch: this.options.globalSearch,
            includeBrowse: this.options.includeBrowse,
            includeFavorites: this.options.includeFavorites,
            selectType: this.options.selectType
          };
          if (!pickerOptions.dialogTitle || pickerOptions.dialogTitle.length === 0) {
            pickerOptions.dialogTitle = lang.addContent;
          }
          pickerOptions.startLocations = [];
          if (pickerOptions.includeBrowse) {
            pickerOptions.startLocations.push("current.location");
          }
          if (pickerOptions.includeFavorites) {
            pickerOptions.startLocations.push("favorites");
          }
          return pickerOptions;
        }
      });
    }
  };
});