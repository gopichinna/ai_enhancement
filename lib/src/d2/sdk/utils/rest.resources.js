/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'dctmw/utils/rest.resources'
], function(_, Backbone, RestResourcesImpl){
  'use strict';

  /**
   * Lets read-only access to some long lived D2-REST resources that are loaded during application startup.
   *
   * @module {d2/sdk/utils/rest.resources} d2/sdk/utils/"rest.resources"
   * @name RestResources
   * @extends {Object}
   */

  function accessor(obj) {
    return _.deepClone(obj, {cloneCloneableObjects: true, copyArbitraryObjects: true});
  }

  return {
    /**
     * Get the root resource links of D2-REST APIs.
     * @returns {D2RestLinkObject[]} resource links
     * @instance
     */
    getHomeDocLinks: function () {
      return accessor(RestResourcesImpl.getHomeDocLinks());
    },

    /**
     * Get the metadata of D2-REST services. It returns build information, authentication type, repository config etc.
     * @returns {ProductInfoModel}
     * @instance
     */
    getProductInfo: function () {
      return accessor(RestResourcesImpl.getProductInfo());
    },

    /**
     * Get the current repository that the user has logged into
     * @returns {RepositoryModel}
     * @instance
     */
    getCurrentRepository: function () {
      return accessor(RestResourcesImpl.getCurrentRepository());
    },

    /**
     * Get data of the logged in user.
     * @returns {UserModel}
     * @instance
     */
    getCurrentUser: function () {
      return accessor(RestResourcesImpl.getCurrentUser());
    },

    /**
     * Get collection of all content formats supported by the repository
     * @returns {FormatCollection}
     * @instance
     */
    getFormats: function () {
      return accessor(RestResourcesImpl.getFormats());
    },

    /**
     * Get D2 runtime options for the logged in user
     * @returns {Object}
     * @instance
     */
    getD2Options: function () {
      return accessor(RestResourcesImpl.getD2Options());
    },

    /**
     * Get all widget configs data available to the logged in user
     * @returns {WidgetConfigsMap}
     * @instance
     */
    getWigetConfigs: function () {
      return accessor(RestResourcesImpl.getWigetConfigs());
    },

    /**
     * Get Documentum types available in the repository
     * @returns {DctmTypesHolder}
     * @instance
     */
    getDctmTypeData: function () {
      return accessor(RestResourcesImpl.getDctmTypeData());
    }
  };

  /**
   * @see {./rest.linkrels|RestLinkrels} for APIs to convert a partial link URL to an absolute URL
   * @typedef {Object} D2RestLinkObject
   * @property {string} rel - Link relation identifier
   * @property {string} [href] - Partial URL for the D2-REST resource
   * @property {string} [hrefTemplate] - Partial templated URL for the D2-REST resource
   */

  /**
   * @typedef {external:Backbone.Model} ProductInfoModel
   */

  /**
   * @typedef {external:Backbone.Model} RepositoryModel
   */

  /**
   * @typedef {external:Backbone.Model} UserModel
   */

  /**
   * @typedef {external:Backbone.Model} FormatModel
   */

  /**
   * @typedef {external:Backbone.Collection} FormatCollection
   * @property {FormatModel[]} models
   */

  /**
   * Widget configs data. Each key of the object is a D2 widget type and the value is another object representing different widget config of the same type.
   * @typedef {Object.<string, WidgetConfigMap>} WidgetConfigsMap
   * @property {string} key - widget type
   * @property {WidgetConfigMap} value - Map of widget configs of this widget type
   */

  /**
   * @typedef {Object.<string, WidgetConfig>} WidgetConfigMap
   * @property {string} key - widget name
   * @property {WidgetConfig} value - A single widget config
   */

  /**
   * Raw widget config
   * @typedef {Object} WidgetConfig
   * @property {string} r_object_id - Documentum object id of this config
   * @property {string} type - Documentum type of this config
   * @property {string} object_name - Name of this widget config
   * @property {string} widget_type - D2-Config type of this widget
   * @property {string} title - Title of this widget
   * @property {string} label_value - Display name of this widget
   * @property {string} desc_value - Description of this widget
   * @property {boolean} customize_columns - Whether the columns of this widgets were customized from its defaults
   * @property {string[]} columns - Associated column keys.
   * @property {Object.<string, string>} widgetParams - Parameters of this widget configuration. This is a Map of key,value pairs where key represent a configured param name.
   * Content of this map varies depending on the `widget_type`.
   */

  /**
   * @typedef {{labels: DictTypeLabels, subTypes: DictTypeSubTypes, superTypes: DictTypeSuperTypes}} DctmTypesHolder
   * @property {DictTypeLabels} labels - Displayable labels for different Documentum types
   * @property {DictTypeSubTypes} subType - Documentum types and their immediate sub-types.
   * @property {DictTypeSuperTypes} superTypes - Documentum types and their immediate super-types.
   */

  /**
   * @typedef {Object.<string, string>} DictTypeLabels
   * @property key - Type name
   * @property value - Displayable name
   */

  /**
   * @typedef {Object.<string, Array.<string>>} DictTypeSubTypes
   * @property key - Type name
   * @property value - All sub types of this type
   */

  /**
   * @typedef {Object.<string, string>} DictTypeSuperTypes
   * @property key - Type name
   * @property value - Super type of this type
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */
});