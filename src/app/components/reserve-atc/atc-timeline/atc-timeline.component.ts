import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Time} from '../Time';

@Component({
  selector: 'app-atc-timeline',
  templateUrl: './atc-timeline.component.html',
  styleUrls: ['./atc-timeline.component.css']
})
export class AtcTimelineComponent implements OnInit {

  @Input() readonly shifts: number;

  @Input() time: {position: string, times: Time[]};

  colorClass: string;

  constructor() {
    this.colorClass = '';
  }

  ngOnInit() {
    switch (this.time.position.slice(-3)) {
      case 'DEL':
        this.colorClass = 'dblue';
        break;
      case 'GND':
        this.colorClass = 'lblue';
        break;
      case 'TWR':
        this.colorClass = 'orange';
        break;
      case 'APP':
        this.colorClass = 'red';
        break;
      case 'DEP':
        this.colorClass = 'pink';
        break;
      case 'CTR':
        this.colorClass = 'green';
        break;
    }
    if (this.time.position.includes('CTR')) {
      this.colorClass = 'green';
    }
  }

  getName(slot) {
    let out = '';
    if (slot.name && slot.name !== '') {
      out += slot.name;
    } else {
      out += slot.user || (!slot.available ? 'Anonymous' : '');
    }

    if (slot.rating && slot.rating !== '') {
      out += ` (${slot.rating})`;
    }

    return out;
  }

  getWidth(slot) {
    const s = AtcTimelineComponent.getNumTime(slot.start);
    const e = AtcTimelineComponent.getNumTime(slot.end);

    const slotNum = (e - s) % this.shifts === 0 ? ((e - s) / this.shifts) : 1;
    return (slotNum * 190 + (slotNum - 1) * 80) + 'px';
  }

  static getNumTime(time: number) {
    const minutes = parseInt(time.toString().slice(-2));
    const hours = (time - minutes) / 100;

    return minutes + (hours * 60);
  }
}
