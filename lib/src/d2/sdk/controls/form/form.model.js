/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'csui/models/form'
], function(FormModelImpl){
  'use strict';

  /**
   * FormModel. Data holder for {@link ./form.view|FormView}.
   *
   * Raw dialog-like response from D2-REST API or literal JSON form data could be passed {@link ./form.converter|FormConverter} to transform it into
   * a compatible format and then the same could be used to instantiate/set into a `FormModel` instance which is later used by a `FormView` to render
   * an HTML form.
   *
   * @example <caption>Sample to create FormModel</caption>
   * define([
   *  'nuc/lib/jquery',
   *  'd2/sdk/controls/form/form.model',
   *  'd2/sdk/controls/form/form.converter',
   *  'd2/sdk/utils/contexts/context.util',
   *  'd2/sdk/utils/contexts/factories/connector'
   * ], function($, FormModel, formConverter, contextUtil, ConnectorFactory){
   *  'use strict';
   *
   * //To instantiate FormModel from a literal schema
   *  var literalSchema = {
   *    id: 'sample_form',
   *    data: {
   *      field1: 'Hello world!'
   *    },
   *    schema: {
   *      id: 'sample_form',
   *      properties: {
   *        field1: {
   *          title: 'Greeting',
   *          type: 'string',
   *          required: false
   *        }
   *      }
   *    },
   *    options: {
   *      fields: {
   *        field1: {
   *          label: 'Greeting',
   *          type: 'dctmwlabel'
   *        }
   *      }
   *    }
   *  };
   *
   *  formConverter.generateFormModelConfig([literalSchema]);
   *
   *  var literalFormModel = new FormModel(literalSchema);
   *
   *
   *  //To instantiate FormModel from a dialog-like REST API response
   *  var context = contextUtil.getPerspectiveContext(),
   *    connector = context && context.getObject(ConnectorFactory);
   *
   *  $.ajax(connector.extendAjaxOptions({
   *    url: '/D2-Smartview/repositories/d2repo/objects/090015fa80002d49/property-page',
   *    success: function(resp) {
   *      var formSchema = formConverter.convertConfig(resp['page-content'], {
   *        actionMode: 'create',
   *        layoutMode: 'single'
   *      });
   *
   *      var dialogFormModel = new FormModel(formSchema.propertiesConfig[0]);
   *    },
   *    error: function() {
   *      console.log('Fetching form failed');
   *    }
   *  }));
   * });
   *
   * @module {d2/sdk/controls/form/form.model} d2/sdk/controls/form/"form.model"
   * @name FormModel
   * @extends {external:Backbone.Model}
   *
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */


  var FormModel = FormModelImpl.extend({
    constructor: function FormModel(attr, options) {
      FormModel.__super__.constructor.call(this, attr, options);
    }
  });

  return FormModel;
});