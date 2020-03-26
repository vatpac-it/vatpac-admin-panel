export class Client {
  _id: number;
  name: string;
  description: string;
  versions: {
    number: string;
    created: string;
    download: string;
    _id: string;
  }[] | number;
}
