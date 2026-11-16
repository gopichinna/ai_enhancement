/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'd2/controls/form/d2.form.view'
], function(_, D2FormViewImpl){

  /**
   * FormView. Create and render an arbitrary HTML form using JSON schema. Form also provides manage API to validate & collect form data.
   *
   * Uses `FormModel` to hold the JSON schema that drives the form rendering. See {@link ./form.model|FormModel} for examples of how to
   * create a `FormModel` from literal JSON data and dialog-like D2-REST API response.
   *
   * @example <caption>To create a form view</caption>
   * define([
   *  'd2/sdk/controls/form/form.view',
   *  'd2/sdk/controls/form/form.model'
   * ], function(FormView, FormModel){
   *  'use strict';
   *
   *  var formOptions = {
   *    topAlignedLabel: true,
   *    mode: 'create',
   *    layoutMode: 'singleCol',
   *    model: createFormModel()
   *  };
   *
   *  function createFormModel() {
   *    var formSchema;
   *
   *    // populate form schema
   *
   *    return new FormModel(formSchema);
   *  }
   *
   *  var formView = new FormView(formOptions); //For controlling any business specific, behavior FormView could be extended to attach business specific logic
   *
   *  formView.on('render:form', function(){
   *    console.log('Form is rendered');
   *  });
   *
   *  new Marionette.Region({el: '.my-form-container'}).show(formView);
   * });
   *
   * @module {d2/sdk/controls/form/form.view} d2/sdk/controls/form/"form.view"
   * @name FormView
   * @extends {external:Marionette.ItemView}
   * @fires module:FormView#d2:change:formValidation
   * @fires module:FormView#change:field
   * @fires module:FormView#valid:field
   * @fires module:FormView#invalid:field
   * @fires module:FormView#form:changed
   * @fires module:FormView#render:form
   */

  /**
   * @external "Marionette.ItemView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.itemview.html
   */

  /**
   * @external FormModel
   * @see ./form.model
   */

  /**
   * Indicates form validation status has changed.
   * @event module:FormView#d2:change:formValidation
   * @type {string}
   */

  /**
   * Indicates a field value has been updated.
   * @event module:FormView#change:field
   * @type {string}
   */

  /**
   * Indicates a field contains a valid value.
   * @event module:FormView#valid:field
   * @type {string}
   */

  /**
   * Indicates a field contains an invalid value.
   * @event module:FormView#invalid:field
   * @type {string}
   */

  /**
   * Indicates that form data has changed somehow.
   * @event module:FormView#form:changed
   * @type {string}
   */

  /**
   * Indicates that form has been fully rendered in UI
   * @event module:FormView#render:form
   * @type {string}
   */


  var FormView = D2FormViewImpl.extend({

    /**
     * @constructs
     * @name FormView
     * @alias module:FormView
     * @param {object} options - Constructor options
     * @param {external:FormModel} options.model - The data holder having schema definition for this form instance.
     * @param {Context} options.context - Reference to the application context.
     * @param {Boolean} [options.topAlignedLabel] - Whether to place label at the top of form field or side-by-side fashion. Defaults to `false`.
     * @param {string} [options.mode] - Controls rendering of the form. Possible values are `'create', 'read', 'update'`. Defaults to `update`. The
     * `read` mode renders a readonly form. Whereas, the `update` & `create` mode are equivalent and allows form field value modification. The difference
     * between `update` and `create` is that form is initially not validated for required values and other conditions for `create` mode until user starts to
     * interact with the form.
     * @param {string} [options.layoutMode] - Whether to layout the form in a single or double column fashion. Supported values are `'singleCol', 'doubleCol'`.
     * Defaults to `singleCol`.
     *
     *
     */
    constructor: function FormView(options) {
      options = options || {};
      FormView.__super__.constructor.call(this, options);
    },

    getFlatFormValueMap: function (map) {
      var me = this,
        properties = {};
      _.each(map, function (value, key) {
        if (_.isArray(value)) {
          if (!_.isObject(value[0])) {
            properties[key] = value;
          } else {
            _.each(_.keys(value[0]), function (k) {
              properties[k] = _.pluck(value, k);
            });
          }
        } else if (!_.isObject(value)) {
          properties[key] = value;
        } else {
          _.extend(properties, me.getFlatFormValueMap(value));
        }
      });
      return properties;
    }
  });

  /**
   * @function
   * @name resetForm
   * @description Reset the current form removing all user inputs.
   * @returns {void}
   * @instance
   */

  /**
   * @function
   * @name validateForm
   * @description Validate current form values and ensure form constraints are met.
   * @param {Boolean} refreshState - Whether to clear previous validation status before running this one.
   * @param {Boolean} validateOnlyRequiredFields - Whether to perform only a required field validation or all other constraints as well.
   * @returns {jQuery.Promise} - Promise is resolved with validation status. A `FormValidationDone` callback could be invoked with the validation result.
   * @instance
   */

  /**
   * @function
   * @name getValues
   * @description Get current field values
   * @returns {object} A JSON in the same structure as the form's field layout definition, it contains key-value pairs at each level where key corresponds
   * to form field name and value corresponds to the data collected from the field.
   * @instance
   */

  /**
   * @function
   * @name getFlatFormValueMap
   * @description Get current field values formatted as a flattened single level key-value hash.
   * @param {object} valueMap - The hierarchical form value map. Basically the return value of `getValues()` could be passed as this parameter.
   * @returns {object} Flattened key-value map.
   * @instance
   */

  /**
   * @callback FormValidationCallback
   * @param {Boolean} isValid - Whether the form is valid.
   */

  /**
   * @function
   * @name getLabelOrValues
   * @description Ge the current field label in the case combo/liost fields and in the case of other fields it will return the values
   * @returns {object} A JSON in the same structure as the form's field layout definition, it contains key-value pairs at each level where key corresponds
   * to form field name and value corresponds to the data collected from the field.
   * @instance
   */

  return FormView;
});