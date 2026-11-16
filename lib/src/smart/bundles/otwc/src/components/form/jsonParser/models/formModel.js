/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
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
