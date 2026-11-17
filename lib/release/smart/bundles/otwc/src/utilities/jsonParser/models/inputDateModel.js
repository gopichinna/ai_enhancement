import { FormElementBaseModel } from './formElementBaseModel.js';

const TYPE_INPUT_DATE_TIME = 'datetime';

class InputDateModel extends FormElementBaseModel {
  placeholder = null;

  dateTime = null;

  displayValue = null;

  format = null;

  invalidDateErrorMessage = null;

  lang = null;

  edit = null;

  setData(schema, options, data) {
    super.setData(schema, options, data);

    if (options.type === TYPE_INPUT_DATE_TIME) {
      options.dateTime = true;
    }

    this.placeholder = this.formatAttributeData(options.placeholder);
    this.dateTime = this.formatAttributeData(options.dateTime, true);
    this.displayValue = this.formatAttributeData(options.displayValue);
    this.format = this.formatAttributeData(schema.format !== 'datetime' ? schema.format : options.format);
    this.invalidDateErrorMessage = this.formatAttributeData(options.invalidDateErrorMessage);
    this.lang = this.formatAttributeData(options.lang);
    this.edit = this.formatAttributeData(options.edit, true);
  }
}

export { InputDateModel };
//# sourceMappingURL=inputDateModel.js.map
