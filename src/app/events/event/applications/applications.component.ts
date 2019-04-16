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

  constructor(private eventsService: EventsService, private activeRoute: ActivatedRoute) { }

  ngOnInit() {
    this.eventsService.currentEvent.subscribe(data => {
      this.model = data;

      this.setAssigned();
    });
  }

  setAssigned() {
    // Airport
    for (let airport in this.model.positions) {
      if (this.model.positions.hasOwnProperty(airport)) {

        // Postion
        for (let position in this.model.positions[airport]) {
          if (this.model.positions[airport].hasOwnProperty(position)) {

            // Date
            for (let date in this.model.positions[airport][position]) {
              if (this.model.positions[airport][position].hasOwnProperty(date)) {

                // Time
                for (let time of this.model.positions[airport][position][date]) {

                  if (typeof time !== 'undefined') {
                    this.model.applications[time.user].dates[date][time.start].assigned = position;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  formatDate(date: string): string {
    let d = new Date(date);

    return d.getUTCDate() + '/' + d.getUTCMonth() + '/' + d.getUTCFullYear();
  }

  assignPosition(cid, user, date, start, icao, position) {
    if (cid && date && start) {
      let end;

      if (icao && position && position !== 'None') {
        const ts = start.toString().split(':');
        end = new Date(Date.UTC(0, 0, 0, parseInt(ts[0]), parseInt(ts[1]), parseInt(ts[2])));
        end = new Date(end.getTime() + this.model.shiftLength * 60 * 1000);


        if (this.model.positions[icao][position][date]) {
          this.model.positions[icao][position][date].forEach((time, i) => {
            if (time.start === start) {
              this.model.positions[icao][position][date].splice(i, 1);
              this.model.applications[time.user].dates[date][start].assigned = null;
            }
          });
        } else {
          this.model.positions[icao][position][date] = [];
        }

        this.model.positions[icao][position][date].push({user: cid, start: start, end: end.toISOString().substr(11, 8)});
      } else {
        Object.keys(this.model.positions).forEach((ic) => {
          Object.keys(this.model.positions[ic]).forEach((pos) => {
            if (this.model.positions[ic][pos][date]) {
              this.model.positions[ic][pos][date].forEach((time, i) => {
                if (time.start === start && time.user === cid) {
                  this.model.positions[ic][pos][date].splice(i, 1);
                  this.model.applications[time.user].dates[date][start].assigned = null;

                  icao = ic;
                  position = pos;
                  end = null;
                }
              });
            }
          });
        });
      }

      this.eventsService.setPosition(this.model.sku, cid, icao, position, date, start, end).subscribe((data) => {
        if (typeof data['request'] !== 'undefined' && data['request']['result'] === 'success') {
          console.log('SET');
        }
      });

      this.eventsService.setEvent(this.model);
    }
  }

}
