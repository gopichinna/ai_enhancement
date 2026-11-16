/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from 'nuc/lib/underscore';
import {Collection, Model} from 'nuc/lib/backbone';
import DialogSchemaBuilder from 'd2/sdk/controls/dialogs/generic/dialog.schema.builder';
import extSchemaBuilders from 'dctm-ext!d2/sdk/controls/dialogs/generic/dialog.schema.builders';

/**
 * D2SV offers registration of custom transformers that work to transform a D2FS dialog structure into
 * UI compatible form schema. This DialogSchemaBuilders collection holds all such registered transformers.
 *
 * @example <caption>To register a new transformer extensions.json is to be modified as below</caption>
 * {
 *  "d2/sdk/controls/dialog/generic/dialog.schema.builder": {
 *    "extensions": {
 *      "mybundle": [
 *        "mybundle/extensions/dialog.transformers"
 *      ]
 *    }
 *  }
 * }
 *
 * @example <caption>whereas dialog.transformers.js may be defined as </caption>
 * define([
 *   'mybundle/dialogs/generic/my.dialog.transformer'
 * ], function(MyDialogTransformer){
 *  return [{
 *    sequence: 1, //defines order of execution across all registered plugins of D2SV, transformers with same sequence number will get executed as per their corresponding D2SV plugin discovery order which is indeterministic in nature.
 *    builderClass: MyDialogTransformer
 *  }];
 * });
 *
 * @example <caption>whereas my.dialog.transformer.js may be defined as </caption>
 * import DialogSchemaBuilder from 'd2/sdk/controls/dialogs/generic/dialog.schema.builder';
 *
 * class MyDialogTransformer extends DialogSchemaBuilder {
 *   buildSchema(formName, formData) {
 *     //formName: D2FS dialog name
 *      //formData: The dialog structure after its initial conversion into UI compatible schema
 *      //this function should return the modified 'formData' after applying its own logic
 *      //this function can also return a Promise which could later be resolve with the formData post transformation.
 *   }
 * }
 *
 * export default MyDialogTransformer;
 *
 * @module {d2/sdk/controls/dialogs/generic/dialog.schema.builders} d2/sdk/controls/dialogs/generic/"dialog.schema.builders"
 * @name DialogSchemaBuilders
 * @extends {external:Backbone.Collection}
 */

/**
 * @external "Backbone.Collection"
 * @see https://backbonejs.org/#Collection
 */
class SchemaBuilderModel extends Model {
  #builderInstance;

  constructor(attr, options) {
    super(attr, options);
  }

  getBuilder() {
    if(!this.#builderInstance) {
      const BuilderClass = this.get('builderClass');
      if((typeof BuilderClass) === 'function') {
        try {
          this.#builderInstance = new BuilderClass();
        }catch(e) {
          console.warn(e);
        }
      }

      if(!(this.#builderInstance instanceof DialogSchemaBuilder)) {
        this.#builderInstance = new DialogSchemaBuilder();
      }
    }

    return this.#builderInstance;
  }

  buildSchema(formName, formData) {
    return new Promise((res, rej) => {
      let retVal = this.getBuilder().buildSchema(formName, formData);

      if(retVal instanceof Promise) {
        retVal.then(res, rej);
        return;
      } else if(retVal === undefined || retVal === null) {
        retVal = formData;
      }

      res(retVal);
    });
  }
}

class SchemaBuilderCollection extends Collection {
  constructor(models, options={}) {
    super(models, options);
  }

  buildSchema(formName, formData) {
    let lastPromise = Promise.resolve(formData);

    this.each((model) => {
      const callBack = function(formData){
        return this.buildSchema(formName, formData);
      }.bind(model);
      lastPromise = lastPromise.then(callBack, callBack);
    });

    return lastPromise;
  }
}

Object.assign(SchemaBuilderModel.prototype, {
  defaults: {
    sequence: 10000
  }
});
Object.assign(SchemaBuilderCollection.prototype, {
  model: SchemaBuilderModel,
  comparator: 'sequence'
});

Object.defineProperty(SchemaBuilderModel.prototype.constructor, 'name', {value: 'SchemaBuilderModel'});
Object.defineProperty(SchemaBuilderCollection.prototype.constructor, 'name', {value: 'SchemaBuilderCollection'});

const schemaBuilders = new SchemaBuilderCollection();
if(extSchemaBuilders) {
  let builders = [].concat(_.flatten(extSchemaBuilders, true));
  schemaBuilders.add(builders, {merge: false});
}

export default schemaBuilders;