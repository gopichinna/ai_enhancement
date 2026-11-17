import { FormElementBaseModel } from './formElementBaseModel.js';

class TextAreaModel extends FormElementBaseModel {
  placeholder = null;

  rows = null;

  minLength = null;

  maxLength = null;

  autoResize = null;

  edit = null;

  validation = null;

  setData(schema, options, data) {
    super.setData(schema, options, data);

    this.placeholder = this.formatAttributeData(options.placeholder);
    this.rows = this.formatAttributeData(options.rows);
    this.minLength = this.formatAttributeData(schema.minLength);
    this.maxLength = this.formatAttributeData(schema.maxLength);
    this.autoResize = this.formatAttributeData(options.autoResize, true);
    this.edit = this.formatAttributeData(options.edit, true);

    this.validation = this.formatAttributeData(JSON.stringify(options.validation));
  }
}

export { TextAreaModel };
//# sourceMappingURL=textAreaModel.js.map
