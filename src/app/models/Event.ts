import {SafeUrl} from "@angular/platform-browser";
import {Form, FormArray, FormControl, FormGroup, Validators} from "@angular/forms";

export class Event {
  _id: string;
  sku: string;
  title: string;
  subtitle: string;
  shiftLength: number;
  start: Date | string;
  end: Date | string;
  published: number | string;
  backgroundImage: string;
  sections: {_id?: number, title: string, content: string, files: {_id: number | string, name: string, file?: SafeUrl}[]}[];
  airports: {airport: {_id: string, icao: string}, kind: string}[];
  available: string[];
  positions: {user: {_id: string, cid: string, first_name: string, last_name: string}, airport: {_id: string, icao: string}, position: string, date: Date, hidden: boolean}[];
  selected: {date: Date, position: string, private: boolean}[];
  applications: {user: {_id: string, cid: string, first_name: string, last_name: string}, positions: string[], date: Date, private: boolean}[];

  constructor() {
    this.sku = '';
    this.title = '';
    this.subtitle = '';
    this.shiftLength = 60;
    this.start = new Date(Date.now());
    this.end = new Date(Date.now() + 259200000);
    this.backgroundImage = '';
    this.sections = [];
    this.published = 0;
    this.airports = [];
    this.available = [];
    this.positions = [];
    this.selected = [];
    this.applications = [];
  }
}

export class EventForm {
  _id: string;
  title = new FormControl('', Validators.required);
  subtitle = new FormControl('', Validators.required);
  sku = new FormControl({value: '', disabled: true}, Validators.required);
  published = new FormControl(0, Validators.required);
  shiftLength = new FormControl(60, [Validators.required, control => {
    let value = control.value;

    if (!value) return null;

    if (value % 30 !== 0) {
      return {notMultipleof30: true}
    }

    return null;
  }]);
  start = new FormControl('', [Validators.required, (control => {
    const value = control.value;

    if (!value) return null;

    if ((value instanceof Date && this.end.value instanceof Date) && value > this.end.value) {
      return {endBeforeStart: true};
    }

    return null;
  })]);
  end = new FormControl('', (control => {
    const value = control.value;

    if (!value) return null;

    if ((value instanceof Date && this.start.value instanceof Date) && value < this.start.value) {
      return {endBeforeStart: true};
    }

    return null;
  }));
  backgroundImage = new FormControl('');
  sections = new FormArray([]);
  airports = new FormArray([]);
  available = new FormArray([]);
  positions = new FormArray([]);
  applications = new FormArray([]);


  constructor(event?: Event) {
    if (event) {
      if (event._id) this._id = event._id;
      if (event.title) this.title.setValue(event.title);
      if (event.subtitle) this.subtitle.setValue(event.subtitle);
      if (event.sku) this.sku.setValue(event.sku);
      if (event.published) this.published.setValue(event.published);
      if (event.shiftLength) this.shiftLength.setValue(event.shiftLength);
      if (event.start) this.start.setValue(event.start);
      if (event.end) this.end.setValue(event.end);
      if (event.backgroundImage) this.backgroundImage.setValue(event.backgroundImage);
      if (event.sections) {
        for (let section of event.sections) {
          this.sections.push(new FormGroup({title: new FormControl(section.title, Validators.required),
            content: new FormControl(section.content, Validators.required),
            files: new FormArray([])}) // TODO: Fix to get files
          );
        }
      }
      if (event.available) {
        for (let available of event.available) {
          this.available.push(new FormControl(available, [Validators.required, Validators.maxLength(15)]));
        }
      }
      if (event.applications) {
        for (let application of event.applications) {
          this.applications.push(new FormGroup({
            user: new FormGroup({
              _id: new FormControl(application.user._id, [Validators.required]),
              cid: new FormControl(application.user.cid, [Validators.required]),
              first_name: new FormControl(application.user.first_name, [Validators.required]),
              last_name: new FormControl(application.user.last_name, [Validators.required])
            }),
            position: new FormControl(application.positions.join(', '), [Validators.required]),
            date: new FormControl(new Date(application.date), [Validators.required]),
            private: new FormControl(application.private, [Validators.required])
          }));
        }
      }
      if (event.positions) {
        for (let position of event.positions) {
          this.positions.push(new FormGroup({
            user: new FormGroup({
              _id: new FormControl(position.user._id, [Validators.required]),
              cid: new FormControl(position.user.cid, [Validators.required]),
              first_name: new FormControl(position.user.first_name, [Validators.required]),
              last_name: new FormControl(position.user.last_name, [Validators.required])
            }),
            position: new FormControl(position.position, [Validators.required]),
            date: new FormControl(new Date(position.date), [Validators.required]),
            hidden: new FormControl(position.hidden, [Validators.required]),
            airport: new FormGroup({
              _id: new FormControl(position.airport._id, [Validators.required]),
              icao: new FormControl(position.airport.icao, [Validators.required])
            })
          }));
        }
      }
      if (event.airports) {
        for (let airport of event.airports) {
          this.airports.push(new FormGroup({
            airport: new FormControl(airport.airport.icao, [Validators.maxLength(4), Validators.required]),
            kind: new FormControl(typeof airport.kind === 'undefined' ? '' : airport.kind, [Validators.required])
          }));
        }
      }
    }
  }
}
