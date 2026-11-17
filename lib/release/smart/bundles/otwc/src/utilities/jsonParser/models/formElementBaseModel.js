import { BaseModel } from './baseModel.js';

class FormElementBaseModel extends BaseModel {
  name = null;

  dark = null;

  readonly = null;

  required = null;

  disabled = null;

  label = null;

  ariaLabel = null;

  infoMessage = null;

  errorMessage = null;

  value = null;

  liveValidation = null;

  interactiveOnly = null;

  constructor(tagName = '', elementName = null) {
    super(tagName);

    this.name = elementName;
  }

  get hasOptions() {
    return false;
  }

  setData(schema, options, data, setValue = true) {
    super.setData(options);

    let { label } = options;
    if (!label || !label.length) {
      label = schema.title ? schema.title : schema.label;
    }

    this.dark = this.formatAttributeData(options.dark, true);
    this.readonly = this.formatAttributeData(schema.readonly, true);
    this.required = this.formatAttributeData(schema.required, true);
    this.disabled = this.formatAttributeData(options.disabled, true);
    this.label = this.formatAttributeData(label);
    this.ariaLabel = this.formatAttributeData(options.ariaLabel);
    this.infoMessage = this.formatAttributeData(options.infoMessage ? options.infoMessage : options.helper);
    this.errorMessage = this.formatAttributeData(options.errorMessage);
    this.liveValidation = this.formatAttributeData(options.liveValidation, true);
    this.interactiveOnly = this.formatAttributeData(options.interactiveOnly, true);

    if (setValue) {
      this.value = this.formatAttributeData(data);
    }
  }
}

export { FormElementBaseModel };
//# sourceMappingURL=formElementBaseModel.js.map
