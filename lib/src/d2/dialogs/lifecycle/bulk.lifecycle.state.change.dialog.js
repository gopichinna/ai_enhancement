/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/jquery.parse.param", "csui/utils/contexts/factories/connector", "d2/utils/constants", "d2/utils/rest.linkrels", "d2/dialogs/lifecycle/lifecycle.state.change.dialog", "d2/dialogs/lifecycle/impl/metadata.properties/lifecycle.mass.update.properties.view", "d2/dialogs/lifecycle/impl/processing/lifecycle.submit.processing.view", "i18n!d2/dialogs/lifecycle/impl/nls/lang" ], function(require, _, $, Backbone, parseParams, ConnectionFactory, constants, RestLinkrels, D2LifecycleStateChangeDialog, MassUpdatePropertiesView, LifecycleSubmitProcessingView, lang) {
  "use strict";
  var D2BulkLifecycleStateChangeDialog = D2LifecycleStateChangeDialog.extend({
    constructor: function D2BulkLifecycleStateChangeDialog() {
      D2LifecycleStateChangeDialog.prototype.constructor.apply(this, arguments);
      this.options.status.bulkLCStateChangeData = {
        "object-ids": this.options.status.nodes.pluck("id")
      };
      this.isBulkTransition = true;
    },
    getStepDefinitions: function(lifeCycleStateConfig) {
      var me = this, node = this.options.status.nodes.at(0), action = this.options.command, lcStateChangeSteps = [], signOffSteps = [], propertiesStep = [];
      this.options.status.lifeCycleStateConfig = lifeCycleStateConfig;
      function getEsignSteps(currentNode, index) {
        if (currentNode.lifeCycleStateConfig) {
          if (currentNode.lifeCycleStateConfig[action.PROPERTIES.SIGNOFF_REQUIRED]) {
            var signOffStep = currentNode.lifeCycleStateConfig["external-esign-off"] ? me.getExternalEsignStepConfig(currentNode, index) : me.getEsignStepConfig(currentNode, index, !!lifeCycleStateConfig["signoff_each_document"]);
            signOffSteps.push(signOffStep);
          }
        }
      }
      if (me.options.directState && !_.isEmpty(this.options?.status?.data?.dialog)) {
        signOffSteps.push(this.getPropertyStepForDialog()[0]);
      }
      if (lifeCycleStateConfig["signoff_each_document"] && !lifeCycleStateConfig["external-esign-off"]) {
        this.options.status.nodes.forEach(function(eachNode, index) {
          getEsignSteps(eachNode, index);
        }, this);
      } else {
        getEsignSteps(node, 0);
      }
      if (!_.isEmpty(lifeCycleStateConfig["property_page_name"]) && RestLinkrels.getLink(lifeCycleStateConfig.links, RestLinkrels.D2_LIFECYCLE_PROPERTIES_PAGE)) {
        var propertiesStepConfig = me.getMassUpdatePropertiesStepConfig(lifeCycleStateConfig);
        propertiesStep.push(propertiesStepConfig);
      }
      if (me.options.directState) {
        lcStateChangeSteps = lcStateChangeSteps.concat(signOffSteps);
      } else {
        lcStateChangeSteps = lcStateChangeSteps.concat(signOffSteps, propertiesStep);
      }
      var processingStep = me.getProcessingStep(LifecycleSubmitProcessingView);
      lcStateChangeSteps.push(processingStep);
      return lcStateChangeSteps;
    },
    getSubTitleForEsign: function(node, index) {
      var nodes = this.options.status.nodes;
      var subTitle = _.str.sformat(lang.D2LifecycleESignSubTitle, nodes.length);
      if (_.isNumber(index) && node.lifeCycleStateConfig["signoff_each_document"]) {
        subTitle = _.str.sformat(lang.D2LifecycleESignEachDocumentSubtitle, index + 1, nodes.length);
      }
      return subTitle;
    },
    getMassUpdatePropertiesStepConfig: function(lifeCycleStateConfig) {
      var me = this, node = new Backbone.Model({}), nodes = this.options.status.nodes, fileCount = nodes.length, validObjects = nodes.map(function(node) {
        return {
          r_object_id: node.get("id"),
          object_name: node.get("name"),
          a_content_type: node.get("aContentType"),
          i_chronicle_id: node.get("i_chronicle_id"),
          r_version_label: node.get("r_version_label"),
          rIsVirtualDoc: node.get("rIsVirtualDoc")
        };
      });
      node.connector = me.options.status.context.getObject(ConnectionFactory);
      var massUpdatepropertiesStepConfig = {
        id: "d2_lifecycle_mass_update_properties",
        viewClass: MassUpdatePropertiesView,
        viewOptions: {
          action: this.options.command,
          status: me.options.status,
          wizard: me.options._wizard,
          node: node,
          context: me.options.status.context,
          langPrefix: "File",
          massUpdateData: {
            massUpdateValidationData: {
              massUpdateApplicableCount: fileCount,
              validObjects: validObjects
            },
            propertyPage: RestLinkrels.getLink(lifeCycleStateConfig.links, RestLinkrels.D2_LIFECYCLE_PROPERTIES_PAGE),
            propertyPageBody: {
              "object-ids": me.options.status.nodes.pluck("id"),
              "property-page": lifeCycleStateConfig["property_page_name"]
            }
          },
          massUpdateOptions: {
            "update-types": constants.MassUpdateOptions.FILE_PROPERTIES
          }
        },
        title: function() {
          return this.getTitle();
        },
        subTitle: function() {
          return this.getSubTitle();
        },
        nextStepId: function() {
          return "d2_lifecycle_submit_processing";
        },
        buttons: [ {
          id: "previous",
          skipInitialHide: true,
          hidden: function() {
            return this.isPreviousButtonHidden();
          },
          toolTip: function() {
            return this.options.wizard.prevStepTooltip;
          },
          clickHandler: function() {
            if (this.metadataView.expandFieldRegion && this.metadataView.expandFieldRegion.currentView) {
              this.onWizardBackClick();
            } else {
              this.options.wizard && this.options.wizard.prevStep();
            }
          }
        }, {
          id: "next",
          disabled: function() {
            return !this.isValid();
          },
          hidden: function() {
            return this.isNextButtonHidden();
          },
          label: function() {
            return this.getNextButtonLabel();
          },
          clickHandler: function() {
            if (this.metadataView.expandFieldRegion && this.metadataView.expandFieldRegion.currentView) {
              this.metadataView.expandFieldRegion.currentView.onUpdateClick();
            } else {
              if (this.metadataView.validateAllChildren()) {
                var massUpdateFormValues = this.metadataView.options.node._massUpdateFormValuesMap;
                if (massUpdateFormValues && massUpdateFormValues["properties-list"] && massUpdateFormValues["properties-list"].length > 0) {
                  _.extend(me.options.status.bulkLCStateChangeData, massUpdateFormValues);
                }
                this.options.wizard.nextStep();
              } else {
                this.options.wizard.refreshFooter();
              }
            }
          }
        } ],
        onCancel: function() {
          return me.options.command.onCancel();
        }
      };
      return massUpdatepropertiesStepConfig;
    }
  });
  return D2BulkLifecycleStateChangeDialog;
});