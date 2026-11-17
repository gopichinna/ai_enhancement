/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Object as MarionetteObject
} from "nuc/lib/marionette";

import NodeCollection from "nuc/models/nodes";

import {
  convertConfig
} from "d2/sdk/controls/form/form.converter";

import extSchemaBuilders from "d2/sdk/controls/dialogs/generic/dialog.schema.builders";

import constants from "d2/utils/constants";

class DialogSchemaBuilder extends MarionetteObject {
  #nodes;
  #data;
  constructor(options = {}) {
    super(options);
    this.#nodes = options.nodes instanceof NodeCollection ? options.nodes : new NodeCollection();
    this.#data = options.data || {};
  }
  buildSchema(dialogName, formData) {
    return new Promise(res => {
      if (_.isObject(formData.dialog)) {
        let actionMode = formData.dialog.mode || this.#data?.mode;
        if (![ "create", "import", "edit" ].find(m => m === actionMode)) {
          actionMode = "edit";
        }
        const schema = convertConfig(formData, {
          actionMode: actionMode,
          layoutMode: this.options.viewMode === constants.WizardType.SIDE_PANEL ? "singleCol" : null,
          d2FormNodeIds: this.#nodes.pluck("id"),
          enableNonFieldExpression: true,
          dialogName: dialogName
        });
        schema.generalConfig = {
          buttons: _.deepClone(formData?.dialog?.buttons?.button) || [],
          id: formData?.dialog.id,
          title: formData?.dialog.label,
          mode: actionMode
        };
        res(schema);
      } else {
        res(formData);
      }
    }).then(data => {
      return extSchemaBuilders.buildSchema(dialogName, data);
    });
  }
}

Object.defineProperty(DialogSchemaBuilder.prototype.constructor, "name", {
  value: "DialogSchemaBuilder"
});

export default DialogSchemaBuilder;