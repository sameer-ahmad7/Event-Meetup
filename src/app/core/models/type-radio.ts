import {TypeModel} from "./type/type.model";

export class TypeRadio extends TypeModel {
  selected: boolean = false;

  constructor(id?: string, description?: string, selected: boolean = false) {
    super(id, description);
    this.selected = selected;
  }
}
