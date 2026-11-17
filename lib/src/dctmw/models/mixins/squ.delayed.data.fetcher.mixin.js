/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import serverQueryUtils from "dctmw/utils/lw.server.query.utils";

const SQUDelayedDataFetcherMixin = {
  mixin(prototype) {
    const originalFetchDelayedData = prototype.fetchDelayedData, origAddOperationsToDelayedDataRequest = prototype.addOperationToDelayedDataRequest, origCollateOperationIntoDelayedDataResponse = prototype.collateOperationIntoDelayedDataResponse, origPrepareObjectPropertiesFromDelayedDataResponse = prototype.prepareObjectPropertiesFromDelayedDataResponse;
    Object.assign(prototype, {
      fetchDelayedData(options = {}) {
        const dfd = $.Deferred();
        const parameters = {
          ids: options.nodes,
          connector: options.connector ?? this.connector,
          handleZeroBatchGracefully: true
        };
        this.trigger("before:delayed:data:send", parameters);
        Object.assign(parameters, {
          cbAddOperationsToBatchRequestPayload: this.addOperationToDelayedDataRequest.bind(this),
          cbCollateOperationIntoBatchResponse: this.collateOperationIntoDelayedDataResponse.bind(this),
          cbPrepareObjectsPropertiesFromBatchResponse: this.prepareObjectPropertiesFromDelayedDataResponse.bind(this)
        });
        serverQueryUtils.fetchDataAsPropertiesForObjects(parameters).done((objectsProperties = {}) => {
          const finishDelayedDataFetch = () => {
            this.trigger("after:delayed:data:receive", options.nodes, objectsProperties);
            dfd.resolve(objectsProperties);
          };
          if (_.isFunction(originalFetchDelayedData)) {
            originalFetchDelayedData.call(this, options).done((otherProperties = {}) => {
              _.extend(objectsProperties, otherProperties);
              finishDelayedDataFetch();
            }).fail(dfd.reject);
          } else {
            finishDelayedDataFetch();
          }
        }).fail(dfd.reject);
        return dfd.promise();
      },
      addOperationToDelayedDataRequest(options = {}) {
        if (_.isFunction(origAddOperationsToDelayedDataRequest)) {
          return origAddOperationsToDelayedDataRequest.call(this, options);
        }
      },
      collateOperationIntoDelayedDataResponse(id, response, output) {
        _.isFunction(origCollateOperationIntoDelayedDataResponse) && origCollateOperationIntoDelayedDataResponse.call(this, id, response, output);
      },
      prepareObjectPropertiesFromDelayedDataResponse(output, objectsProperties) {
        _.isFunction(origPrepareObjectPropertiesFromDelayedDataResponse) && origPrepareObjectPropertiesFromDelayedDataResponse.call(this, output, objectsProperties);
      }
    });
    return prototype;
  }
};

export default SQUDelayedDataFetcherMixin;