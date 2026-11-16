/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  Collection
} from "nuc/lib/backbone";

import FormModel from "d2/sdk/controls/form/form.model";

import DialogFormCollectionView from "d2/dialogs/generic/dialog.form.collection.view";

import DialogContentView from "d2/sdk/controls/dialogs/generic/dialog.content.view";

class FormCollection extends Collection {
  constructor(models, options) {
    super(models, options);
    this.fetched = true;
  }
}

Object.assign(FormCollection.prototype, {
  model: FormModel
});

class DefaultDialogContentView extends DialogContentView {
  constructor(options = {}) {
    super(options);
  }
  resolveView(options = {}) {
    return new Promise(res => {
      let formMode = options["originalResponse"] && options["originalResponse"]["page-content"] && options["originalResponse"]["page-content"]["dialog"] && options["originalResponse"]["page-content"]["dialog"]["form_mode"] && options["originalResponse"]["page-content"]["dialog"]["form_mode"] === "read" ? "update" : "create";
      let formView = new DialogFormCollectionView({
        formMode: formMode,
        layoutMode: options.layoutMode,
        collection: new FormCollection(options.formSchema.propertiesConfig)
      });
      res(formView);
    });
  }
}

Object.defineProperty(DefaultDialogContentView.prototype.constructor, "name", {
  value: "DefaultDialogContentView"
});

export default DefaultDialogContentView;