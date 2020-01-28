import {Component, Input, OnInit} from '@angular/core';
import {EventsService} from '../../services/events.service';
import {ActivatedRoute} from '@angular/router';
import {UserService} from '../../services/user.service';
import {CoreResponse} from "../../models/CoreResponse";
import {AlertService} from "../../services/alert.service";
import {Time} from "./Time";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-reserve-atc',
  templateUrl: './reserve-atc.component.html',
  styleUrls: ['./reserve-atc.component.css']
})
export class ReserveATCComponent implements OnInit {
  public positions: { user: { _id: string, cid: string, first_name: string, last_name: string, atc_rating: string }, airport: { _id: string, icao: string }, position: string, date: Date, hidden: boolean }[];
  public available: string[];

  public shifts: number;
  public start: Date;
  public end: Date;

  public dates: Date[] = [];
  public airports: Array<String> = [''];
  public timelineTimes: Array<number> = [];

  currentFilter = {airport: '', position: ''};
  currentDate: Date;

  public filteredTimes: { airport: string, modifier: string, position: string, times: Array<Time> }[] = [];

  public times: { airport: string, modifier: string, position: string, times: Array<Time> }[] = [];

  constructor(public activeModal: NgbActiveModal) { }

  get disabled() {
    return window.innerWidth < 700
  }

  ngOnInit() {
    let currentDate = this.start;
    while (currentDate <= this.end) {
      if (this.dates.findIndex(d => d.isSameDateAs(currentDate)) === -1) this.dates.push(new Date(currentDate));
      currentDate = ReserveATCComponent.addHours(currentDate, 1);
    }

    for (let position of this.available) {
      let el = position.split('-');
      if (el[0] === position) {
        el = position.split('_');
        el[2] = el[1];
        el[1] = '';
      } else {
        const t = el[1].split('_');
        el[1] = t[0];
        el[2] = t[1];
      }
      if (this.times.findIndex(e => e.airport === el[0] && e.modifier === el[1] && e.position === el[2]) === -1) {
        this.times.push({
          airport: el[0] || '',
          modifier: el[1] || '',
          position: el[2],
          times: []
        });
      }
      if (this.airports.indexOf(el[0]) === -1) {
        this.airports.push(el[0]);
      }
    }

    this.setTimesForDay(this.start);
  }

  setTimesForDay(start: Date) {
    this.currentDate = start;
    this.timelineTimes = [];

    let empties = [];
    const sa = this.getNumTime(start);
    const ea = this.getEndTime(start);
    for (let s = sa; s < ea; s += this.shifts) {
      const e = s + this.shifts;

      const o_s = this.getOutTime(s);
      const o_e = this.getOutTime(e);

      if (!this.timelineTimes.includes(o_s)) this.timelineTimes.push(o_s);

      empties.push(<Time>{start: o_s, end: o_e, user: null, available: true});
    }
    if (sa > ea) {
      const o_s = this.getOutTime(sa);
      empties.push(<Time>{start: o_s, end: 0, user: null, available: true});
      this.timelineTimes.push(o_s);
    }

    for (let position in this.times) {
      this.times[position].times = empties.slice();
    }

    for (let position of this.positions) {
      const d = new Date(position.date);
      if (d.isSameDateAs(start)) {
        for (let time of this.times) {
          let t = position.position.split('_');
          if (t.length === 1) {
            t[1] = t[0];
            t[0] = '';
          }
          if (time.airport === position.airport.icao && t[0] === time.modifier && t[1] === time.position) {
            const s = this.getNumTime(d);
            const o_s = this.getOutTime(s);
            const o_e = this.getOutTime(s + this.shifts);

            const i = time.times.findIndex(t => t.start === o_s && t.end === o_e);
            time.times[i] = <Time>{
              start: o_s,
              end: o_e,
              user: position.user.cid,
              name: position.user.first_name + (position.user.last_name.length > 0 ? ' ' + position.user.last_name : ''),
              rating: position.user.atc_rating,
              available: false
            };
          }
        }
      }
    }
    this.filteredTimes = this.times;

    this.filterTimes(this.currentFilter);
  }

  hasPositions(airport: string) {
    let p = (airport === '') ? this.times : this.times.filter(t => t.airport === airport);
    return Array.from(new Set(p.map(t => t.position)));
  }

  getEndTime(date: Date) {
    if (date.isSameDateAs(this.end)) {
      return this.getNumTime(this.end);
    } else {
      return 1440;
    }
  }

  // Gets Date time in minutes
  getNumTime(date: Date) {
    const minutes = date.getMinutes();
    const hours = date.getHours();

    return minutes + (hours * 60);
  }

  // Time in HHMM
  getOutTime(time: number) {
    const minutes = time % 60;
    const hours = Math.floor(time / 60);

    return (hours * 100) + minutes;
  }

  filterTimes(filter: { airport: string, position: string }) {
    this.filteredTimes = this.times;
    this.currentFilter = filter;

    if (filter.airport === '' && filter.position === '') return;

    if (filter.airport === '' && filter.position !== '') {
      this.filteredTimes = this.times.filter(time => time.position.slice(-3) === filter.position);
    } else if (filter.airport !== '' && filter.position === '') {
      this.filteredTimes = this.times.filter(time => time.airport === filter.airport);
    } else {
      this.filteredTimes = this.times.filter(time => time.airport === filter.airport && time.position.slice(-3) === filter.position);
    }
  }

  formatTime(time: number): string {
    let ret_t = time.toString();
    while (ret_t.length < 4) {
      ret_t = '0' + ret_t;
    }
    return ret_t;
  }

  formatDate(date: string | Date) {
    const dDate = new Date(date);
    let day = '' + dDate.getDate(),
      month = '' + (dDate.getMonth() + 1);
    const year = dDate.getFullYear();
    if (day.length < 2) {
      day = '0' + day;
    }
    if (month.length < 2) {
      month = '0' + month;
    }

    return [day, month, year].join('/');
  }

  static addHours(date, hours) {
    const dat = new Date(date);
    dat.setHours(dat.getHours() + hours);
    return dat;
  }

}
