export class Client {
  id: number;
  sku: string;
  name: string;
  description: string;
  versions: {
    number: string;
    created: string;
    download: string;
    _id: string;
  }[];
}
