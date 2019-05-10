export class User {
  cid: string;
  name?: string;
  first_name: string;
  last_name: string;
  atc_rating: string;
  pilot_rating: number | [string] | string;
  email: string;
  group_name?: string;
  groups: {primary: Group, secondary: Group[]};
  country: string;
  region: string;
  division: string;
  discord: {id: string, username: string, discriminator: string, avatar: string, allowed: boolean | null};
  perms: Perm[];
}

class Group {
  id: number;
  name: string;
  colour: string;
}

class Perm {
  id: number;
  name: string;
  description: string;
}
