import { formatAttributeData } from '../utilities.js';
import { BaseModel } from './baseModel.js';

class FormModel extends BaseModel {
  action = null;

  method = null;

  target = null;

  acceptCharset = null;

  setData(options) {
    super.setData(options);

    this.action = formatAttributeData(options?.action);
    this.method = formatAttributeData(options?.method);
    this.target = formatAttributeData(options?.target);
    this.acceptCharset = formatAttributeData(options?.acceptCharset);
  }
}

export { FormModel };
//# sourceMappingURL=formModel.js.map
