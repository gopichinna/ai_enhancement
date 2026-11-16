/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import NodeModel from "d2/sdk/models/node.model";

import MetadataPropertiesView from "d2/widgets/metadata/metadata.properties.view";

import D2GeneralFormView from "d2/widgets/metadata/general.panels/d2/d2.general.form.view";

import Session from "dctmw/utils/authenticators/session";

class DialogFormCollectionView extends MetadataPropertiesView {
  className() {
    let superClass = _.isFunction(super.className) ? super.className.apply(this, arguments) : super.className;
    return `${superClass} d2-dialog-form-collection`;
  }
  constructor(options = {}) {
    options.node = options.node || new NodeModel();
    options.context = Session.get().getContext();
    super(options);
  }
  contentView() {
    return D2GeneralFormView;
  }
  contentViewOptions(model) {
    const cvOptions = super.contentViewOptions(model);
    let mode = this.options.formMode || "create";
    return {
      ...cvOptions,
      ...{
        mode: mode,
        layoutMode: this.options.layoutMode
      }
    };
  }
  validateForm(refreshState, validateOnlyRequiredFields) {
    if (this.allFormsRendered === true) {
      return new Promise(res => {
        let allFormsValid = true;
        let promises = this.tabContent.children.map(tab => tab.content.validateForm(refreshState, validateOnlyRequiredFields));
        $.whenAll.apply($, promises).done(function(states) {
          states.forEach(v => {
            allFormsValid = allFormsValid && v;
          });
          res(allFormsValid);
        }).fail(() => {
          res(false);
        });
      });
    } else {
      return Promise.resolve(false);
    }
  }
  getValues() {
    return this.getFormsValues();
  }
  getFlatFormValueMap(map) {
    var me = this, properties = {};
    _.each(map, function(value, key) {
      if (_.isArray(value)) {
        if (!_.isObject(value[0])) {
          properties[key] = value;
        } else {
          _.each(_.keys(value[0]), function(k) {
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
}

Object.defineProperty(DialogFormCollectionView.prototype.constructor, "name", {
  value: "DialogFormCollectionView"
});

export default DialogFormCollectionView;