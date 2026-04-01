export interface AirtableBase {
  id: string;
  name: string;
  permissionLevel: string;
}

export interface AirtableBasesResponse {
  bases: AirtableBase[];
}
