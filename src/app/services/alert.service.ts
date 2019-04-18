import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {debounceTime} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  private _alert = new BehaviorSubject<{type: string, message: string}[]>([]);

  constructor() {
    this._alert.pipe(
      debounceTime(5000)
    ).subscribe((alerts) => { alerts.shift(); this._alert.next(alerts); });
  }

  get alert(): BehaviorSubject<{ type: string; message: string }[]> {
    return this._alert;
  }

  add(type, message) {
    let alerts = this._alert.value;
    alerts.push({type: type, message: message});
    this._alert.next(alerts);
    console.log(alerts);
  }

  remove(index) {
    let alerts = this._alert.value;
    alerts.splice(index, 1);
    this._alert.next(alerts);
  }
}
