import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  private _alerts = new BehaviorSubject<{type: string, message: string, permanent: boolean, delay: number}[]>([]);

  constructor() {
  }

  get alerts(): BehaviorSubject<{ type: string; message: string }[]> {
    return this._alerts;
  }

  add(type, message, permanent = false, delay = 5000) {
    let $this = this;
    setTimeout(function () {
      const alerts = $this._alerts.value;
      if (alerts.length >= 3) {
        for (const alert of alerts) {
          if (!alert.permanent) {
            alerts.splice(alerts.indexOf(alert), 1);
            break;
          }
        }
      }

      alerts.push({type: type, message: message, permanent: permanent, delay: delay});
      $this._alerts.next(alerts);
    }, 100);
  }

  remove(index) {
    const alerts = this._alerts.value;
    alerts.splice(index, 1);
    this._alerts.next(alerts);
  }
}
