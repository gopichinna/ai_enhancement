/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import Url from "nuc/utils/url";

import Constants from "d2/utils/constants";

import RestLinkrels from "d2/utils/rest.linkrels";

import RestResources from "dctmw/utils/rest.resources";

import "css!d2/commands/open.plugins/impl/iviewer/markupfilters/markupfilters.style";

const MarkupFilterService = {
  getMarkupFiltersList(connector, documentId, bearerToken) {
    const currRepoLinks = RestResources.getCurrentRepository().get("links");
    const queryParam = "document_id=" + encodeURIComponent(documentId);
    const baseUrl = Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.SELF), "iv-markup-filter");
    const userInfoUrl = Url.appendQuery(baseUrl, queryParam);
    return $.ajax(connector.extendAjaxOptions({
      url: userInfoUrl,
      type: "GET",
      headers: {
        "IV-LOGIN-TOKEN": bearerToken,
        Accept: Constants.MediaTypes.JSON
      }
    })).then(response => Array.isArray(response?.filters) ? response.filters : []);
  },
  saveMarkupFilter(connector, title, bearerToken, documentId, filterContent, isDefaultFilter) {
    const currRepoLinks = RestResources.getCurrentRepository().get("links");
    const url = Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.SELF), "iv-markup-filter-create");
    return $.ajax(connector.extendAjaxOptions({
      url: url,
      type: "POST",
      dataType: "json",
      headers: {
        "IV-LOGIN-TOKEN": bearerToken,
        "Content-Type": Constants.MediaTypes.DCTM_JSON
      },
      data: JSON.stringify({
        filter_name: title,
        source_object_id: documentId,
        filter_content: encodeURIComponent(JSON.stringify(filterContent)),
        is_default_filter: isDefaultFilter
      })
    }));
  },
  deleteMarkupFilter(connector, bearerToken, rObjectId) {
    const currRepoLinks = RestResources.getCurrentRepository().get("links");
    const baseUrl = Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.SELF), "iv-markup-filter-delete");
    const queryParam = "r_object_id=" + rObjectId;
    const urlWithParams = Url.appendQuery(baseUrl, queryParam);
    return $.ajax(connector.extendAjaxOptions({
      url: urlWithParams,
      type: "DELETE",
      contentType: Constants.MediaTypes.JSON,
      headers: {
        "IV-LOGIN-TOKEN": bearerToken,
        Accept: Constants.MediaTypes.JSON
      }
    }));
  },
  updateDefaultFilter(connector, bearerToken, rObjectId) {
    const currRepoLinks = RestResources.getCurrentRepository().get("links");
    const baseUrl = Url.combine(RestLinkrels.getLink(currRepoLinks, RestLinkrels.SELF), "iv-markup-filter-update");
    const queryParam = "r_object_id=" + rObjectId;
    const urlWithParams = Url.appendQuery(baseUrl, queryParam);
    return $.ajax(connector.extendAjaxOptions({
      url: urlWithParams,
      type: "POST",
      contentType: Constants.MediaTypes.JSON,
      headers: {
        "IV-LOGIN-TOKEN": bearerToken,
        Accept: "application/json"
      }
    }));
  }
};

export default MarkupFilterService;