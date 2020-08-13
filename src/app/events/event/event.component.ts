import {Component, OnDestroy, OnInit} from '@angular/core';
import {EventsService} from "../../services/events.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Observable, of, Subject, Subscription} from "rxjs";
import {map, takeUntil} from "rxjs/operators";
import {AlertService} from "../../services/alert.service";
import {Event} from "../../models/Event";
import {CoreResponse} from "../../models/CoreResponse";
import {FormGroup, ValidationErrors} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss']
})
export class EventComponent implements OnInit, OnDestroy {

  event: FormGroup;
  eventSub: Subscription;


  sku: string;
  loading$ = false;
  deleteLoading$ = false;
  submitDisabled = false;
  submitTxt = 'Submit';

  constructor(private eventsService: EventsService, private route: ActivatedRoute, public router: Router, private alertService: AlertService, private _modalService: NgbModal) {
  }

  ngOnInit() {
    this.sku = this.route.snapshot.params['id'];
    if (this.sku) {
      this.submitTxt = 'Save';

      this.eventSub = this.eventsService.getEvent(this.sku).subscribe(data => {
        this.event = data;
      });
    } else {
      this.eventSub = this.eventsService.currentEvent.subscribe(data => {
        this.event = data;
      });
      this.submitTxt = 'Create';
    }
  }

  ngOnDestroy() {
    this.eventSub.unsubscribe()
  }

  confirmDeleteEvent(content) {
    if (this.sku) {
      this._modalService.open(content, {ariaLabelledBy: 'confirm-delete-modal'}).result.then((result) => {
        if (result === 'okClick') {
          this.deleteLoading$ = true;
          this.eventsService.deleteEvent(this.sku).subscribe(res => {
            res = new CoreResponse(res);
            this.deleteLoading$ = false;
            if (!res.success()) {
              this.alertService.add('danger', 'Error deleting event. Please try again later.');
            } else {
              this.alertService.add('success', 'Successfully deleted event.');
              this.router.navigate(['/events']);
            }
          }, error => {
            this.deleteLoading$ = false;
            this.alertService.add('danger', 'Error deleting event. Please try again later.');
          });
        }
      });
    }
  }

  submit() {
    if (!this.event.valid) {
      this.alertService.add('danger', 'Error Updating Event: There are some errors present.');
      return;
    }

    let set = false;
    this.loading$ = true;
    this.submitDisabled = true;

    let event = this.event.getRawValue();
    if (!set) {
      if (this.sku) {
        this.eventsService.editEvent(event._id, event).subscribe(res => {
          res = new CoreResponse(res);

          if (res.success()) {
            this.submitTxt = 'Saved';
            this.alertService.add('success', 'Saved Event Successfully.');

            let this$ = this;
            setTimeout(function () {
              this$.router.navigate(['/events']);
            }, 1000);
          } else {
            this.alertService.add('danger', 'There was an error updating the event, please try again. ' + res.request.message || '');
          }
          this.loading$ = false;
          this.submitDisabled = false;
        }, error1 => {
          this.alertService.add('danger', 'There was an error updating the event, please try again. ' + error1.error.request.message || '');
          this.loading$ = false;
          this.submitDisabled = false;
        });
      } else {
        this.eventsService.createEvent(event).subscribe(res => {
          res = new CoreResponse(res);
          if (res.success()) {
            this.submitTxt = 'Saved';
            this.alertService.add('success', 'Saved Event Successfully.');

            let this$ = this;
            setTimeout(function () {
              this$.router.navigate(['/events']);
            }, 1000);
          } else {
            this.alertService.add('danger', 'There was an error creating the event, please try again. ' + res.request.message || '');
          }
          this.loading$ = false;
          this.submitDisabled = false;
        }, error1 => {
          this.alertService.add('danger', 'There was an error creating the event, please try again. ' + error1.error.request.message || '');
          this.loading$ = false;
          this.submitDisabled = false;
        });
      }

      set = true;
    }
  }

}
