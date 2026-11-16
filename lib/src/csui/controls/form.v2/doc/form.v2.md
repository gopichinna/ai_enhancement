# FormView V2 (controls/form.v2/form.v2.view)

  The `FormView V2`view renders an html form which has different kind of html elements
  based on the given form model. The FormViewV2 internally uses [Form Web Component](http://elliot.otxlab.net/ot-web-components/?path=/docs/components-form--docs),
  which builds each html element defined by the form model.
  
  ### Example

    var formDescr = {
      "data": {
        "name": "Enterprise"
      },
      "options": {
        "fields": {
          "name": {
            "hidden": false,
            "hideInitValidationError": true,
            "label": "Name",
            "readonly": false,
            "type": "text"
          }
        }
      },
      "schema": {
        "properties": {
          "name": {
            "maxLength": 248,
            "minLength": 1,
            "readonly": false,
            "required": true,
            "title": "Name",
            "type": "string"
          }
        },
        "type": "object"
      }
    };

      var contentRegion = new Marionette.Region({el: '#content'}),
          formModel = new FormModel(formDescr),
          formView = new FormViewV2({model: formModel});

      contentRegion.show(formView);

## Constructor Summary

### constructor(options)

  Creates a new `FormViewV2`.

#### Parameters:

***options***: Construction parameters (object literal)

***options.model***: Form model with the form specification
  (Backbone.Model instance with attributes like `{data, schema, options}`)

***options.context***: Context to provide the server connection or other contextual objects
  (Context instance)

***options.columns***: The number of columns, which the element's content can break into.
  If there is no value given, the form will behave responsively. 
  The number of columns will be calculated dynamically based on the width of the screen and the min-width definition for a form element of 176px.
  ( Numeric value)

***options.mode***: Show the form in different mode. Supported modes are: `read`, `edit`, `inline-edit`.
( String value)

#### Returns:

  The newly created object instance.

#### Example:

  See the [FormViewV2](#) object for an example.

## Form interaction

### Form data

To get the form data as an object with key value, you can use the method `FormViewV2.getData()`;

### Form validation

The method `FormViewV2.validate()` can be used to trigger the form validation;


