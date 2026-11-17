import { BaseModel } from './baseModel.js';

class ContainerModel extends BaseModel {
  title = null;

  elements = [];

  setData(schema, options) {
    super.setData(options);

    this.title = schema?.title !== undefined ? schema.title : null;
  }

  setElements(elements) {
    this.elements = elements;
  }
}

export { ContainerModel };
//# sourceMappingURL=containerModel.js.map
