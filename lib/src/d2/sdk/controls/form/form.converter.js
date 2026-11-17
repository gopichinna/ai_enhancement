/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/widgets/metadata/utils/form.converter'
], function(FormConverterImpl){
  'use strict';

  /**
   * Form converter. Utility to transform D2 Form metadata.
   *
   * @module {d2/sdk/controls/form/form.converter} d2/sdk/controls/form/"form.converter"
   * @name FormConverter
   * @extends {Object}
   */

  /**
   * @typedef {Object} ConversionReturnType
   * @property {Object} propertiesConfig - Alpaca schema for the main form
   * @property {Object} signOffConfig - Alpaca schema for D2 Electronic signature form
   */

  /**
   * @see {@link http://www.alpacajs.org/docs/api/forms.html|Alpaca Forms}
   * @typedef {Object} AlpacaSchema
   * @property {object} data - Object hash of initial values for each field property
   * @property {object} schema - Container of schema properties
   * @property {object} schema.properties - Object hash defining schema for each field property.
   * @property {object} options - Container of additional options
   * @property {object} options.fields - Object hash defining options for each field property.
   *
   * @example
   * var form = {
   *    data: {
   *      field1: 'Hello world!'
   *    },
   *    schema: {
   *      properties: {
   *        field1: {
   *          type: 'string',
   *          required: true
   *        }
   *      }
   *    },
   *    options: {
   *      fields: {
   *        field1: {
   *          type: 'text',
   *          label: 'Greetings'
   *        }
   *      }
   *    }
   * };
   */

  return {
    /**
     * Convert a D2 Form metadata into an Alpaca form schema.
     * @see {@link http://www.alpacajs.org/docs/api/forms.html|Alpaca Forms}
     *
     * @note Alpaca form schema generated through this method does not have to go through `generateFormModelConfig()` method below.
     *
     * @param {JSON} formJSON - Raw dialog-like response received from a D2-REST API or an equivalent object constructed literally.
     * @param {Object} options - Holder of transformer parameters
     * @param {string} [options.actionMode] - How to process the fields. Can be one of 'create', 'read', 'edit'. 'read' is for readonly mode, other two are editable. Value of this option
     * influences the list of fields and their conditions processed as per equivalent D2-config property page field modes.
     * @param {string} [options.layoutMode] - By default fields are laid out in a double column fashion, if a single-column is desired instead set this option to 'singleCol'.
     *
     * @returns {ConversionReturnType} `propertiesConfig` & `signOffConfig` are two separate alpaca form schema to collect properties and user's electronic signature.
     * @static
     */
    convertConfig: function (formJSON, options) {
      return FormConverterImpl.convertConfig(formJSON, options);
    },

    /**
     * Inject additional data into an Alpaca form schema and make it compatible for {@link ./form.model|FormModel} & {@link ./form.view|FormView}.
     * If more than one form is passed in the input, the method also generates cross-reference data if one form uses value from other, for any reason.
     * @param {AlpacaSchema[]} formArray - Array of Alpaca form schemas. The parameter is also the output parameter, each element in the array
     * is modified with additional data.
     * @param {object} [options] - Additional data/control flag used during the conversion.
     * @param {object} [options.initialFieldValueMap] - Initial data reference for all the fields across forms.
     * @returns {void}
     * @static
     */
    generateFormModelConfig: function(formArray, options) {
      return FormConverterImpl.generateFormModelConfig(formArray, options);
    }


  };
});
