import {SafeUrl} from "@angular/platform-browser";

export class Event {
  id: number;
  sku: string;
  title: string;
  subTitle: string;
  shiftLength: number;
  start: Date | string;
  end: Date | string;
  published: number | string;
  sections: {id?: number, title: string, content: string, images: {id: number | string, name: string, file?: SafeUrl}[]}[];
  airports: {icao: string, type: number}[];
  positions: {[icao: string]: {[position: string]: {[date: string]: {user: string, start: any, end: any}[]}}};
  selected: {[date: string]: {[time: string]: {airport: string, position: string}}};
  applications: {[cid: number]: {user: {name: string, rating: string}, dates: {[date: string]: {[time: string]: {positions: [string], data_hidden: boolean, assigned: string}}}}};

  constructor() {
    this.sku = '';
    this.title = '';
    this.subTitle = '';
    this.shiftLength = 60;
    this.start = new Date(Date.now());
    this.end = new Date(Date.now() + 259200000);
    this.sections = [];
    this.published = 0;
    this.airports = [];
    this.positions = {};
    this.selected = {};
  }
}
