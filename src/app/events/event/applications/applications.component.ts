import {Component, OnDestroy, OnInit} from '@angular/core';
import {EventsService} from "../../../services/events.service";
import {Event, EventForm} from "../../../models/Event";
import {ActivatedRoute} from "@angular/router";
import {AlertService} from "../../../services/alert.service";
import {Form, FormArray, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Subscription} from "rxjs";
import {CoreResponse} from "../../../models/CoreResponse";

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit, OnDestroy {

  event: FormGroup = this.fb.group(new EventForm());
  eventSub: Subscription;

  selectedPositions: {date: Date, user_id: string, position: string}[] = [];

  loading: {userId: string, date: Date}[] = [];
  success: {userId: string, date: Date}[] = [];

  constructor(private eventsService: EventsService, private activeRoute: ActivatedRoute, private alertService: AlertService, private fb: FormBuilder) { }

  ngOnInit() {
    this.eventSub = this.eventsService.currentEvent.subscribe(data => {
      this.event = data;

      this.positions.controls.forEach(pos => {
        let p = pos as FormGroup;
        let user = p.controls.user as FormGroup;
        const ps = p.controls.position.value;
        const icao = (p.controls.airport as FormGroup).controls.icao.value;

        this.selectedPositions.push({date: p.controls.date.value, user_id: user.controls._id.value, position: icao + (icao.includes('_') ? '-' : '_') + ps})
      });
    });
  }

  ngOnDestroy() {
    this.eventSub.unsubscribe()
  }

  get applications() {
    return this.event.controls.applications as FormArray;
  }

  get available() {
    return this.event.controls.available as FormArray;
  }

  get positions() {
    return this.event.controls.positions as FormArray;
  }

  getApplicationGroup(i) {
    return this.applications.controls[i] as FormGroup;
  }

  getUserGroup(group) {
    return group.controls.user as FormGroup;
  }

  selected(date, user_id) {
    // console.log(positions.controls);
    let ps = this.selectedPositions.filter(pos => {
      return pos.date.getTime() === date.getTime() && pos.user_id === user_id;
    });

    return ps.length > 0 ? ps[0].position : null;
  }

  // setAssigned() {
  //   // Airport
  //   for (let airport in this.model.positions) {
  //     if (this.model.positions.hasOwnProperty(airport)) {
  //
  //       // Postion
  //       for (let position in this.model.positions[airport]) {
  //         if (this.model.positions[airport].hasOwnProperty(position)) {
  //
  //           // Date
  //           for (let date in this.model.positions[airport][position]) {
  //             if (this.model.positions[airport][position].hasOwnProperty(date)) {
  //
  //               // Time
  //               for (let time of this.model.positions[airport][position][date]) {
  //
  //                 if (typeof time !== 'undefined' && Object.keys(this.model.applications).length > 0) {
  //                   this.model.applications[time.user].dates[date][time.start].assigned = position;
  //                 }
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // }

  isLoading(userId, date) {
    return this.loading.some(l => l.userId === userId && l.date === date);
  }

  isSuccess(userId, date) {
    return this.success.some(l => l.userId === userId && l.date === date);
  }

  formatDate(date: string): string {
    let d = new Date(date);

    return d.getUTCDate() + '/' + d.getUTCMonth() + '/' + d.getUTCFullYear();
  }

  formatTime(date: string): string {
    let d = new Date(date);

    return (d.getUTCHours() < 10 ? '0' + d.getUTCHours() : d.getUTCHours()) + ':' + (d.getUTCMinutes() < 10 ? '0' + d.getUTCMinutes() : d.getUTCMinutes());
  }

  assignPosition(userId, date, position, hidden) {
    if (userId && date && !this.isLoading(userId, date)) {
      this.loading.push({userId: userId, date: date});

      this.eventsService.setPosition(this.event.controls.sku.value, userId, position, date, hidden).subscribe((res) => {
        res = new CoreResponse(res);
        if (!res.success()) {
          this.alertService.add('danger', 'Error: Could not assign position');
        } else {
          if (position === null) {
            this.selectedPositions.splice(this.selectedPositions.findIndex(pos => pos.date.getTime() === date.getTime() && pos.user_id === userId), 1);
          } else {
            this.selectedPositions.push({date: date, user_id: userId, position: position});
          }
          this.success.push({userId: userId, date: date});

          let this$ = this;
          setTimeout(function () {
            this$.success = this$.success.filter(s => s.userId !== userId && s.date !== date);
          }, 2000);
        }

        this.loading = this.loading.filter(l => l.userId !== userId && l.date !== date);
      }, error => {
        this.alertService.add('danger', 'Error: Could not assign position');
      });

      // this.eventsService.setEvent(this.model);
    }
  }

}
