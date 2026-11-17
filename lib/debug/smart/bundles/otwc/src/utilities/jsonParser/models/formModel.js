import { BaseModel } from './baseModel.js';

class FormModel extends BaseModel {
  action = null;

  method = null;

  target = null;

  acceptCharset = null;

  setData(options) {
    super.setData(options);

    this.action = this.formatAttributeData(options?.action);
    this.method = this.formatAttributeData(options?.method);
    this.target = this.formatAttributeData(options?.target);
    this.acceptCharset = this.formatAttributeData(options?.acceptCharset);
  }
}

export { FormModel };
//# sourceMappingURL=formModel.js.map
