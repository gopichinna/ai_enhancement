import { formatAttributeData } from '../utilities.js';
import { FormElementBaseModel } from './formElementBaseModel.js';

const TYPE_INPUT_DATE_TIME = 'datetime';

class InputDateModel extends FormElementBaseModel {
  placeholder = null;

  dateTime = null;

  displayValue = null;

  format = null;

  invalidDateErrorMessage = null;

  lang = null;

  setData(schema, options, data) {
    super.setData(schema, options, data);

    if (options.type === TYPE_INPUT_DATE_TIME) {
      options.dateTime = true;
    }

    this.placeholder = formatAttributeData(options.placeholder);
    this.dateTime = formatAttributeData(options.dateTime, true);
    this.displayValue = formatAttributeData(options.displayValue);
    this.format = formatAttributeData(schema.format !== 'datetime' ? schema.format : options.format);
    this.invalidDateErrorMessage = formatAttributeData(options.invalidDateErrorMessage);
    this.lang = formatAttributeData(options.lang);
  }
}

export { InputDateModel };
//# sourceMappingURL=inputDateModel.js.map
