import { FormElementBaseModel } from './formElementBaseModel.js';
import { formatAttributeData } from '../utilities.js';

class TextAreaModel extends FormElementBaseModel {
  placeholder = null;

  rows = null;

  minLength = null;

  maxLength = null;

  autoResize = null;

  setData(schema, options, data) {
    super.setData(schema, options, data);

    this.placeholder = formatAttributeData(options.placeholder);
    this.rows = formatAttributeData(options.rows);
    this.minLength = formatAttributeData(schema.minLength);
    this.maxLength = formatAttributeData(schema.maxLength);
    this.autoResize = formatAttributeData(options.autoResize, true);
  }
}

export { TextAreaModel };
//# sourceMappingURL=textAreaModel.js.map
