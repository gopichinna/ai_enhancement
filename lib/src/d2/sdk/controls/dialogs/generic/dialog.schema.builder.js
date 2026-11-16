/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {Object as MarionetteObject} from 'nuc/lib/marionette';

class DialogSchemaBuilder extends MarionetteObject {
  constructor(options={}) {
    super(options);
  }

  async buildSchema(formName, formData) {
    return formData;
  }
}

Object.defineProperty(DialogSchemaBuilder.prototype.constructor, 'name', {value: 'DialogSchemaBuilder'});
export default DialogSchemaBuilder;