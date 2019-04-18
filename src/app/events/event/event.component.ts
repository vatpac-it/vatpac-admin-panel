import {Component, OnInit} from '@angular/core';
import {EventsService} from "../../services/events.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {AlertService} from "../../services/alert.service";

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss']
})
export class EventComponent implements OnInit {

  sku: string;
  loading$ = false;
  submitDisabled = false;
  submitTxt = 'Submit';

  private componetDestroyed: Subject<any> = new Subject<any>();

  constructor(private eventsService: EventsService, private route: ActivatedRoute, public router: Router, private alertService: AlertService) {
  }

  ngOnInit() {
    this.sku = this.route.snapshot.params['sku'];
    if (this.sku) {
      this.submitTxt = 'Save';

      let this$ = this;
      setTimeout(function () {
        this$.eventsService.currentEvent.pipe(takeUntil(this$.componetDestroyed)).subscribe((data) => {
          if (typeof data.id === 'undefined') {
            this$.router.navigate(['/events']);
            this$.componetDestroyed.next();
            this$.componetDestroyed.unsubscribe();
          }
        });
      }, 3000);

      this.eventsService.getEvent(this.sku);
    } else {
      this.submitTxt = 'Create';
    }
  }

  submit() {
    let set = false;
    this.loading$ = true;
    this.submitDisabled = true;

    this.eventsService.currentEvent.subscribe(event => {
      if (!set) {
        console.log(event);
        if (this.sku) {
          this.eventsService.editEvent(event).subscribe(data => {
            console.log(data);

            if (data['request'] && data['request']['result'] && data['request']['result'] === 'success') {
              this.submitTxt = 'Saved';

              let this$ = this;
              setTimeout(function () {
                this$.router.navigate(['/events']);
              }, 1000);
            }
            this.loading$ = false;
            this.submitDisabled = false;
          });
        } else {
          this.eventsService.createEvent(event).subscribe(data => {
            console.log(data);

            if (data['request'] && data['request']['result'] && data['request']['result'] === 'success') {
              this.submitTxt = 'Saved';
              this.alertService.add('success', 'Saved Event Successfully.');

              let this$ = this;
              setTimeout(function () {
                this$.router.navigate(['/events']);
              }, 1000);
            }
            this.loading$ = false;
            this.submitDisabled = false;
          });
        }

        set = true;
      }
    });
  }

}
