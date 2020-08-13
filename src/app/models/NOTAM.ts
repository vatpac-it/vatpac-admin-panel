import {User} from "./User";

export class NOTAM {
  _id: string;
  title: string;
  message: string;
  start: Date | string;
  end: Date | string;
  type: string;
  author: User | string;
}
