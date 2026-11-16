/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
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
