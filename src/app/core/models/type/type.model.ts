export class TypeModel {
  id!: string;
  description?: string;

  constructor(id?: string, description?: string) {
    if (id)
      this.id = id;
    this.description = description;
  }
}
