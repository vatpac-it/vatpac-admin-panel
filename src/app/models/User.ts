export class User {
  cid: string;
  name?: string;
  first_name: string;
  last_name: string;
  atc_rating: string;
  pilot_rating: string;
  email: string;
  group_name?: string;
  group: {id: number, name: string};
  perms: {id: number, name: string, description: string}[];
}
