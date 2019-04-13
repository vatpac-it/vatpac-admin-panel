import { Component, OnInit } from '@angular/core';
import {EventsService} from "../../../services/events.service";
import {Event} from "../../../models/Event";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit {

  model: Event;

  objectKeys = Object.keys;

  positions = [];

  constructor(private eventsService: EventsService, private activeRoute: ActivatedRoute) { }

  ngOnInit() {
    let set = false;
    this.eventsService.currentEvent.subscribe(data => {
      this.model = data;

      if (!set && this.model.id) {
        this.positions = ['None'];
        for (let airport in this.model.positions) {
          if (this.model.positions.hasOwnProperty(airport)) {
            for (let position in this.model.positions[airport]) {
              if (this.model.positions[airport].hasOwnProperty(position)) {
                this.positions.push({icao: airport, position: position});
              }
            }
          }
        }

        set = true;
      }
    });
  }

  formatDate(date: string): string {
    let d = new Date(date);

    return d.getUTCDate() + '/' + d.getUTCMonth() + '/' + d.getUTCFullYear();
  }

  assignPosition(cid, user, date, start, icao, position) {
    if (cid && date && start && icao && position) {
      if (position !== 'None') {
        this.model.applications[cid].dates[date][start].assigned = position;

        const ts = start.toString().split(':');
        let end = new Date(Date.UTC(0, 0, 0, parseInt(ts[0]), parseInt(ts[1]), parseInt(ts[2])));
        end = new Date(end.getTime() + this.model.shiftLength * 60 * 1000);

        this.model.positions[icao][position][date] = [{name: user.name, rating: user.rating, start: start, end: end.toISOString().substr(11, 8)}];

        // this.eventsService.setPosition(this.model.sku, cid, icao, position, date, start, end).subscribe((data) => {
        //   console.log(data);
        //   if (typeof data['request'] !== 'undefined' && data['request']['result'] === 'success') {
        //     // this.buttonDisabled = true;
        //     // this.buttonTxt = 'Application Submitted';
        //     console.log('SET');
        //   }
        // });
      } else {
        this.model.applications[cid].dates[date][start].assigned = null;
      }

      this.eventsService.setEvent(this.model);
    }
  }

}
