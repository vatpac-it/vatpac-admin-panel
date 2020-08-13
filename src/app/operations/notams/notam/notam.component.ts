import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from "@angular/forms";
import {NotamsService} from "../../../services/notams.service";
import {CoreResponse} from "../../../models/CoreResponse";
import {AlertService} from "../../../services/alert.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Subscription} from "rxjs";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {AirportsService} from "../../../services/airports.service";

@Component({
  selector: 'app-notam',
  templateUrl: './notam.component.html',
  styleUrls: ['./notam.component.scss']
})
export class NotamComponent implements OnInit, OnDestroy {

  id: string;
  notamSub: Subscription;

  notam = new FormGroup({
    title: new FormControl('', Validators.required),
    link: new FormControl('', Validators.required),
    start: new FormControl('', Validators.required),
    end: new FormControl('', Validators.required),
    type: new FormControl('', Validators.required),
    restrictedAirspace: new FormArray([])
  });

  types = [];

  loading$ = false;
  deleteLoading$ = false;
  submitTxt = 'Save NOTAM';
  canSubmit$ = true;

  constructor(private notamsService: NotamsService, private _modalService: NgbModal, private alertService: AlertService, private router: Router, private route: ActivatedRoute, private modalService: NgbModal) {
    this.notamsService.getTypes().subscribe(res => {
      res = new CoreResponse(res);
      if (res.success()) {
        this.types = res.body.types;
        this.notam.controls.type.setValue(this.types[0]);
      } else {
        this.alertService.add('danger', 'Error: Unable to get Notams');
        this.router.navigate(['../']);
      }
    }, error => {
      this.alertService.add('danger', 'Error: Unable to get Notams');
      this.router.navigate(['../']);
    })
  }

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    if (this.id) {
      this.submitTxt = 'Save';

      this.notamSub = this.notamsService.getNOTAM(this.id).subscribe(res => {
        res = new CoreResponse(res);
        if (!res.success()) {
          this.alertService.add('danger', 'There was an error getting the NOTAM');
          this.router.navigate(['../']);
          return;
        }

        this.notam.controls.title.setValue(res.body.notam.title);
        this.notam.controls.link.setValue(res.body.notam.link);
        this.notam.controls.start.setValue(new Date(res.body.notam.start));
        this.notam.controls.end.setValue(new Date(res.body.notam.end));
        this.notam.controls.type.setValue(res.body.notam.type);
        if (res.body.notam.restrictedAirspace && Array.isArray(res.body.notam.restrictedAirspace)) {
          for (let ra of res.body.notam.restrictedAirspace) {
            this.ras.controls.push(new FormControl(ra, Validators.required));
          }
        }
      }, error1 => {
        this.alertService.add('danger', 'There was an error getting the NOTAM');
        this.router.navigate(['../']);
      });
    } else {
      this.submitTxt = 'Create';
    }
  }

  ngOnDestroy() {
    if (this.notamSub) {
      this.notamSub.unsubscribe();
    }
  }

  get ras() { return this.notam.controls.restrictedAirspace as FormArray }

  getDisplayType(type) {
    if (!type) return '';
    return type.replace('-', ' ').split(' ').map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase() ).join(' ');
  }

  addRAs() {
    this.ras.push(
      new FormControl('', Validators.required)
    );
  }

  removeRAs(i) {
    this.ras.removeAt(i);
  }

  confirmClear(content) {
    if (this.ras.length > 0) {
      this._modalService.open(content, {ariaLabelledBy: 'confirm-clear-modal'}).result.then((result) => {
        if (result === 'ok-click') {
          this.ras.clear();
        }
      });
    }
  }

  submitNotam() {
    if (this.notam.valid) {
      this.loading$ = true;
      this.canSubmit$ = false;

      const notam = this.notam.getRawValue();
      if (this.id) {
        this.notamsService.editNOTAM(this.id, notam).subscribe(res => {
          res = new CoreResponse(res);
          if (!res.success()) {
            this.alertService.add('danger', 'There was an error editing the NOTAM');
          } else {
            this.submitTxt = 'Saved';
            this.alertService.add('success', 'Successfully edited the NOTAM');

            let this$ = this;
            setTimeout(function () {
              this$.router.navigate(['/operations/notams']);
            }, 1000);
          }
          this.loading$ = false;
        }, error1 => {
          this.alertService.add('danger', 'There was an error editing the NOTAM');
          this.loading$ = false;
          this.canSubmit$ = true;
        });
      } else {
        this.notamsService.createNOTAM(notam).subscribe(res => {
          res = new CoreResponse(res);
          if (!res.success()) {
            this.alertService.add('danger', 'There was an error creating the NOTAM');
          } else {
            this.submitTxt = 'Saved';
            this.alertService.add('success', 'Successfully created NOTAM');

            let this$ = this;
            setTimeout(function () {
              this$.router.navigate(['/operations/notams']);
            }, 1000);
          }
          this.loading$ = false;
        }, error1 => {
          this.alertService.add('danger', 'There was an error creating the NOTAM');
          this.loading$ = false;
          this.canSubmit$ = true;
        });
      }
    } else {
      this.alertService.add('danger', 'There are some errors in the fields');
    }
  }

  deleteNOTAM(content) {
    if (this.id) {
      this.modalService.open(content, {ariaLabelledBy: 'confirm-delete-modal'}).result.then((result) => {
        if (result === 'ok-click') {
          this.deleteLoading$ = true;
          this.notamsService.deleteNOTAM(this.id).subscribe(res => {
            res = new CoreResponse(res);
            this.deleteLoading$ = false;

            if (!res.success()) {
              this.alertService.add('danger', 'Error deleting NOTAM. Please try again later.');
            } else {
              this.alertService.add('success', 'Successfully deleted NOTAM.');
              this.router.navigate(['/operations/notams']);
            }
          }, error => {
            this.deleteLoading$ = false;
            this.alertService.add('danger', 'Error deleting NOTAM. Please try again later.');
          });
        }
      });
    }
  }

}
