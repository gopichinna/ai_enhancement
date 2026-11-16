import { FormElementBaseModel } from './formElementBaseModel.js';
import { formatAttributeData } from '../utilities.js';

class ToggleModel extends FormElementBaseModel {
  checked = null;

  setData(schema, options, data) {
    super.setData(schema, options, data);

    this.checked = data === true ? true : formatAttributeData(options.checked);
  }
}

export { ToggleModel };
//# sourceMappingURL=toggleModel.js.map
