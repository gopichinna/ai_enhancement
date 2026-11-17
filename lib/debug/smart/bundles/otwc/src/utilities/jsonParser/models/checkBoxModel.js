import { FormElementBaseModel } from './formElementBaseModel.js';

class CheckBoxModel extends FormElementBaseModel {
  checked = null;

  setData(schema, options, data) {
    super.setData(schema, options, data);

    this.checked = data === true ? true : this.formatAttributeData(options.checked);
  }
}

export { CheckBoxModel };
//# sourceMappingURL=checkBoxModel.js.map
