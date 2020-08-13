import {Component, OnDestroy, OnInit} from '@angular/core';
import {EventsService} from "../../../services/events.service";
import {Event, EventForm} from "../../../models/Event";
import {ActivatedRoute} from "@angular/router";
import {AlertService} from "../../../services/alert.service";
import {Form, FormArray, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Subscription} from "rxjs";
import {CoreResponse} from "../../../models/CoreResponse";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ReserveATCComponent} from "../../../components/reserve-atc/reserve-atc.component";

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit, OnDestroy {

  event: FormGroup = this.fb.group(new EventForm());
  addApplicationForm: FormGroup = new FormGroup({
    cid: new FormControl('', Validators.required),
    position: new FormControl('', Validators.required),
    date: new FormControl('', Validators.required)
  });
  eventSub: Subscription;

  selectedPositions: {date: Date, user_id: string, position: string}[] = [];

  deselected = [];

  loading: {userId: string, date: Date}[] = [];
  success: {userId: string, date: Date}[] = [];

  applicationLoading$ = false;

  constructor(private eventsService: EventsService, private activeRoute: ActivatedRoute, private modalService: NgbModal, private alertService: AlertService, private fb: FormBuilder) { }

  ngOnInit() {
    this.eventSub = this.eventsService.currentEvent.subscribe(data => {
      this.event = data;

      this.deselected = this.applications.controls.filter(app => app.get('position').value === 'DESELECTED').map(app => {
        return {
          date: app.get('date').value,
          user: (app.get('user') as FormGroup).getRawValue()
        }
      });

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

  openPreview() {
    const modalRef = this.modalService.open(ReserveATCComponent, {centered: true, size: 'xl'});
    modalRef.componentInstance.positions = this.positions.getRawValue();
    modalRef.componentInstance.available = this.available.getRawValue();
    modalRef.componentInstance.shifts = this.event.get('shiftLength').value;
    modalRef.componentInstance.start = this.event.get('start').value;
    modalRef.componentInstance.end = this.event.get('end').value;
  }

  openAddApplication(modal) {
    const modalRef = this.modalService.open(modal, {centered: true, size: 'lg'});
    modalRef.result.then(result => {
      if (result !== 'ok') return;
      if (this.addApplicationForm.valid) {
        this.applicationLoading$ = true;
        const positions = [{position: this.addApplicationForm.get('position').value, date: this.addApplicationForm.get('date').value}];
        console.log(positions, this.event.get('sku').value, this.addApplicationForm.get('cid').value);
        this.eventsService.addApplication(this.event.get('sku').value, this.addApplicationForm.get('cid').value, positions).subscribe((res) => {
          res = new CoreResponse(res);
          console.log(res);
          if (!res.success()) {
            this.alertService.add('danger', 'Could not add application: ' + res.request.message);
          } else {
            console.log(res.body);
            if (res.body.applications.length === 0) return this.alertService.add('danger', 'Could not add application');
            const application = res.body.applications[0];
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
            this.alertService.add('success', 'Position added successfully');
            this.addApplicationForm.reset();
          }
          this.applicationLoading$ = false;
        }, error => {
          console.log(error);
          let errmsg = '';
          if (error.error && error.error.request) {
            errmsg = ': ' + error.error.request.message;
          } else if (error.status === 409) {
            errmsg = ': Position taken';
          }
          this.applicationLoading$ = false;
          this.alertService.add('danger', 'Could not add application' + errmsg);
        })
      }
    }).catch(_ => {})
  }

  sendReminder() {
    this.eventsService.sendReminder(this.event.get('sku').value).subscribe({
      next: res => {
        res = new CoreResponse(res);
        if (!res.success()) {
          return this.alertService.add('danger', 'Error sending reminder email');
        }
        this.alertService.add('success', 'Reminder email sent successfully');
      },
      error: err => {
        this.alertService.add('danger', 'Error sending reminder email');
      }
    })
  }

  isLoading(userId, date) {
    return this.loading.some(l => l.userId === userId && l.date === date);
  }

  isSuccess(userId, date) {
    return this.success.some(l => l.userId === userId && l.date === date);
  }

  formatDate(date: string): string {
    let d = new Date(date);

    return d.getUTCDate() + '/' + (parseInt(d.getUTCMonth().toString()) + 1) + '/' + d.getUTCFullYear();
  }

  formatTime(date: string): string {
    let d = new Date(date);

    return (d.getUTCHours() < 10 ? '0' + d.getUTCHours() : d.getUTCHours()) + ':' + (d.getUTCMinutes() < 10 ? '0' + d.getUTCMinutes() : d.getUTCMinutes());
  }

  assignPosition(user: FormGroup, date, position, hidden) {
    const userId = user.get('_id').value;
    if (userId && date && !this.isLoading(userId, date)) {
      this.loading.push({userId: userId, date: date});

      this.eventsService.setPosition(this.event.controls.sku.value, userId, position, date, hidden).subscribe((res) => {
        res = new CoreResponse(res);
        if (!res.success()) {
          this.alertService.add('danger', 'Could not assign position: ' + res.request.message);
        } else {
          if (position === null) {
            this.selectedPositions.splice(this.selectedPositions.findIndex(pos => pos.date.getTime() === date.getTime() && pos.user_id === userId), 1);
            this.positions.controls.splice(this.positions.controls.findIndex(p => p.get('date').value.getTime() === date.getTime() && p.get('user').get('_id').value === userId), 1);
          } else {
            this.selectedPositions.push({date: date, user_id: userId, position: position});
            this.positions.controls.push(new FormGroup({
              user: new FormGroup({
                _id: new FormControl(res.body.position.user._id, [Validators.required]),
                cid: new FormControl(res.body.position.user.cid, [Validators.required]),
                first_name: new FormControl(res.body.position.user.first_name, [Validators.required]),
                last_name: new FormControl(res.body.position.user.last_name, [Validators.required])
              }),
              position: new FormControl(res.body.position.position, [Validators.required]),
              date: new FormControl(new Date(res.body.position.date), [Validators.required]),
              hidden: new FormControl(res.body.position.hidden, [Validators.required]),
              airport: new FormGroup({
                _id: new FormControl(res.body.position.airport._id, [Validators.required]),
                icao: new FormControl(res.body.position.airport.icao, [Validators.required])
              })
            }))
          }
          this.success.push({userId: userId, date: date});

          let this$ = this;
          setTimeout(function () {
            this$.success = this$.success.filter(s => s.userId !== userId && s.date !== date);
          }, 2000);
        }

        this.loading = this.loading.filter(l => l.userId !== userId && l.date !== date);
      }, error => {
        let errmsg = '';
        if (error.error.request) {
          errmsg = ': ' + error.error.request.message;
        } else if (error.status === 409) {
          errmsg = ': Position taken';
        }
        this.loading = this.loading.filter(l => l.userId !== userId && l.date !== date);
        this.alertService.add('danger', 'Could not assign position' + errmsg);
      });

      // this.eventsService.setEvent(this.model);
    }
  }

}
