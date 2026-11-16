/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "dctmw/server.adaptors/converters/node", "d2/server.adaptors/widgets/metadata/metadata.forms/task.metadata.form", "d2/utils/rest.linkrels", "d2/widgets/metadata/utils/form.converter", "i18n!csui/widgets/metadata/impl/nls/lang", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "dctmw/utils/utils", "d2/utils/constants" ], function($, _, nodeConverter, taskMetaForm, RestLinkrels, MetadataConverter, lang, genFormModel, utils, constants) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        url: function() {
          return "";
        },
        syncFromCache: function() {
          var formResponse = MetadataConverter.convertConfig(this.cachedData["page-content"], this.cachedData["options"]);
          this.set(this.parse(formResponse), {
            silent: true
          });
        },
        sync: function(method, collection, options) {
          var me = this, deferred = $.Deferred(), url = RestLinkrels.getLink(this.node.get("links"), RestLinkrels.SELF);
          options = _.defaults({
            parse: false
          }, options);
          this.trigger("request", this, {}, options);
          if (this.node.propertiesSource && this.node.propertiesSource.url) {
            var body = this.node.propertiesSource.body, ajaxOptions = this.node.connector.extendAjaxOptions({
              url: this.node.propertiesSource.url,
              type: "GET",
              headers: {
                "Content-Type": constants.MediaTypes.DCTM_JSON
              },
              success: function(response) {
                me._fetchPropertyPageFromProfile(method, options, response);
                deferred.resolve();
              },
              error: function(request, textStatus, error) {
                error = utils.parseAjaxError(request, textStatus, error, request.responseJSON && request.responseJSON.code === "E_SYSOBJECT_NOT_FOUND");
                deferred.reject(error, request, textStatus);
              }
            });
            if (body) {
              ajaxOptions.type = "POST";
              ajaxOptions.data = JSON.stringify(body);
            }
            $.ajax(ajaxOptions);
          } else {
            if (me.node.get("type") === constants.Types.TASK) {
              me.node._changedFormValuesMap = {
                properties: {},
                signoffInputs: {}
              };
              setTimeout(function() {
                var config = me._getConvertedMetadataConfigFromRawResponse(taskMetaForm.getMetadataForTask(me.node));
                me._updateProcessVariables(me.node, config);
                options.success && options.success(config, options);
                deferred.resolve();
              }, 0);
            } else {
              $.ajax(this.node.connector.extendAjaxOptions({
                url: url,
                success: function(response) {
                  me.node.attributes.links = response.links;
                  me.node.d2DocumentType = response.type;
                  me.node._changedFormValuesMap = {
                    properties: {},
                    signoffInputs: {}
                  };
                  me._fetchPropertyPage(method, collection, options).done(function() {
                    options.deferred.resolve();
                  }).fail(function(error) {
                    options.deferred.reject(error);
                  });
                },
                error: function(request, textStatus, error) {
                  var errData = utils.parseAjaxError(request, textStatus, error);
                  options.deferred.reject(errData);
                }
              }));
            }
          }
          return deferred.promise();
        },
        _fetchPropertyPageFromProfile: function(method, options, response) {
          if (method === "read") {
            var formJSON = response["page-content"];
            var converterOptions = {
              actionMode: this.action,
              layoutMode: this.layoutMode,
              externalEsignOff: response["external-esign-off"],
              externalAuditURL: RestLinkrels.getLink(response["links"], RestLinkrels.D2_EXTERNAL_SIGN_OFF_AUDIT_EVENTS)
            };
            if (this.node.propertiesForceFetch && this.node.has("properties")) {
              var properties = _.clone(this.node.get("properties"));
              if (this.node.overrideIgnoreFields && this.node.overrideIgnoreFields.length > 0) {
                converterOptions.overrideIgnoreFields = this.node.overrideIgnoreFields;
              }
              if (this.node.asyncFieldDefaultDataSourceObject) {
                converterOptions.asyncFieldDefaultDataSourceObject = this.node.asyncFieldDefaultDataSourceObject;
              }
              converterOptions.overrideValues = properties;
              converterOptions.overrideDateFormat = "YYYY-MM-DDTHH:mm:ss.SSSZZ";
              this.node.propertiesForceFetch = false;
            }
            if (this.node.isMassUpdate) {
              converterOptions.isMassUpdate = this.node.isMassUpdate;
              converterOptions.massUpdateFileCount = this.node.propertiesSource && this.node.propertiesSource.body && this.node.propertiesSource.body["object-ids"].length;
              converterOptions.maxObjectThresholdReached = formJSON.dialog.content.maxObjectThresholdReached;
              converterOptions.massUpdateDocumentType = this.node.massUpdateDocumentType;
              converterOptions.massUpdateNodes = this.node.massUpdateNodes;
              this.node.massUpdateSaveUrl = RestLinkrels.getLink(response.links, RestLinkrels.D2_MASS_UPDATE_PROPERTIES);
              this.node.maxObjectsForMassUpdatePropertyFetch = response.maxObjectsForMassUpdatePropertyFetch;
              this.node.maxObjectThresholdReached = converterOptions.maxObjectThresholdReached;
            }
            this.cachedData = {
              "page-content": formJSON,
              options: converterOptions
            };
            this.configuredFocusControlName = !_.isEmpty(formJSON.dialog.focus) ? formJSON.dialog.focus : undefined;
            var formResponse = MetadataConverter.convertConfig(formJSON, converterOptions);
            options.success && options.success(formResponse, options);
          }
        },
        _fetchPropertyPage: function(method, collection, options) {
          if (method === "read") {
            var me = this, urlForm = RestLinkrels.getLink(me.node.get("links"), RestLinkrels.PROPERTY_PAGE);
            var promiseForm = this._resolve(this, urlForm, this._form);
            return $.when(promiseForm).done(_.bind(function(response1) {
              options.success && options.success(this._getConvertedMetadataConfigFromRawResponse(response1), options);
            }, me));
          }
        },
        _updateProcessVariables(node, config) {
          if (node.get("process_variables")) {
            var pageContent = node.get("process_variables")["page-content"];
            var form = MetadataConverter.convertConfig(pageContent);
            config.propertiesConfig.push(form.propertiesConfig[0]);
          }
        },
        _getConvertedMetadataConfigFromRawResponse: function(rawResponse) {
          var formJSON = rawResponse["page-content"], opt = {
            actionMode: this.fetchActionMode(this),
            externalEsignOff: rawResponse["external-esign-off"],
            externalAuditURL: RestLinkrels.getLink(rawResponse["links"], RestLinkrels.D2_EXTERNAL_SIGN_OFF_AUDIT_EVENTS),
            d2FormNodeIds: [ this.node.get("id") ]
          };
          this.cachedData = {
            "page-content": formJSON,
            options: opt
          };
          this.configuredFocusControlName = !_.isEmpty(formJSON.dialog.focus) ? formJSON.dialog.focus : undefined;
          return MetadataConverter.convertConfig(formJSON, opt);
        },
        _resolve: function(self, url) {
          var promise = $.Deferred();
          $.ajax(self.node.connector.extendAjaxOptions({
            url: url,
            headers: {
              Accept: constants.MediaTypes.DCTM_D2_V1_JSON,
              "Content-Type": constants.MediaTypes.DCTM_D2_V1_JSON
            },
            success: function(response, textStatus, request) {
              promise.resolve(response, textStatus, request);
            },
            error: function(request, textStatus, error) {
              var errData = utils.parseAjaxError(request, textStatus, error, request.responseJSON && request.responseJSON.code === "E_SYSOBJECT_NOT_FOUND");
              promise.reject(errData);
            }
          }));
          return promise.promise();
        },
        parse: function(formResponses) {
          var formModelArray = [];
          var signOffResponse = formResponses.signOffConfig;
          if (signOffResponse) {
            this.signOffFormModel = new genFormModel(signOffResponse);
          }
          _.each(formResponses.propertiesConfig, function(formResponse) {
            var form = _.extend({
              data: {},
              schema: {},
              options: {}
            }, formResponse);
            var formModel = new genFormModel(form);
            formModelArray.push(formModel);
          });
          return formModelArray;
        },
        fetchActionMode: function(form) {
          var action = form && form.options && form.options.action;
          if (action === "create") {
            return "create";
          } else if (action === "import") {
            return "import";
          } else {
            return "edit";
          }
        }
      });
    }
  };
  return ServerAdaptorMixin;
});