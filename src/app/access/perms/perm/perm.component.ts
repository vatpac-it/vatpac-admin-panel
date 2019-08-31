import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {AlertService} from "../../../services/alert.service";
import {PermsService} from "../../../services/perms.service";
import {CoreResponse} from "../../../models/CoreResponse";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-perm',
  templateUrl: './perm.component.html',
  styleUrls: ['./perm.component.scss']
})
export class PermComponent implements OnInit {

  perm = new FormGroup({
    sku: new FormControl('', Validators.required),
    name: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required)
  });

  sku: string;
  submitTxt = "Create Perm";
  loading$ = false;
  canSubmit$ = true;
  deleteLoading$ = false;

  constructor(private route: ActivatedRoute, private router: Router, private alertService: AlertService, private permsService: PermsService, private _modalService: NgbModal) {
    this.sku = this.route.snapshot.params['sku'];
    if (this.sku) {
      let valSet = false;
      permsService.getPerm(this.sku).subscribe(res => {
        res = new CoreResponse(res);
        if (res.success()) {
          this.perm.controls['sku'].setValue(res.body.perm.sku);
          this.perm.controls['sku'].disable();
          this.perm.controls['name'].setValue(res.body.perm.name);
          this.perm.controls['description'].setValue(res.body.perm.description);

          this.submitTxt = "Edit Perm";

          valSet = true;
        } else {
          alertService.add('danger', 'Error getting perm');
          router.navigate(['/access/perms']);
        }

        setTimeout(function () {
          if (!valSet) {
            alertService.add('danger', 'Error getting perm');
            router.navigate(['/access/perms']);
          }
        }, 3000);
      });
    }
  }

  ngOnInit() {
  }

  submitPerm() {
    this.loading$ = true;
    let sku = this.perm.controls['sku'];
    let name = this.perm.controls['name'];
    let description = this.perm.controls['description'];

    if (!sku.valid || !name.valid || !description.valid) return this.alertService.add('danger', 'One or more fields are invalid. Please correct them before trying again.');

    if (this.sku) {
      this.permsService.editPerm(this.sku, name.value, description.value).subscribe(res => {
        res = new CoreResponse(res);
        if (res.success()) {
          this.submitTxt = 'Saved';
          this.alertService.add('success', 'Saved Permission Successfully.');

          this.canSubmit$ = false;
          let this$ = this;
          setTimeout(function () {
            this$.router.navigate(['/access/perms']);
          }, 1000);
        } else {
          this.alertService.add('danger', 'There was an error updating the permission, please try again later.');
        }
        this.loading$ = false;
      }, (err) => {
        this.alertService.add('danger', 'There was an error updating the permission, please try again later.');
      });
    } else {
      this.permsService.createPerm(sku.value, name.value, description.value).subscribe(res => {
        res = new CoreResponse(res);
        if (res.success()) {
          this.submitTxt = 'Saved';
          this.alertService.add('success', 'Saved Permission Successfully.');

          this.canSubmit$ = false;
          let this$ = this;
          setTimeout(function () {
            this$.router.navigate(['/access/perms']);
          }, 1000);
        } else {
          this.alertService.add('danger', 'There was an error creating the permission, please try again later.');
        }
        this.loading$ = false;
      }, (err) => {
        this.alertService.add('danger', 'There was an error creating the permission, please try again later.');
      });
    }
  }

  deletePerm(content) {
    if (this.sku) {
      this._modalService.open(content, {ariaLabelledBy: 'confirm-delete-modal'}).result.then((result) => {
        if (result === 'okClick') {
          this.deleteLoading$ = true;

          this.permsService.deletePerm(this.sku).subscribe(res => {
            res = new CoreResponse(res);
            if (res.success()) {
              this.alertService.add('success', 'Deleted Permission Successfully.');

              this.router.navigate(['/access/perms']);
            } else {
              this.alertService.add('danger', 'There was an error deleting the permission, please try again later.');
            }
            this.deleteLoading$ = false;
          }, (err) => {
            this.alertService.add('danger', 'There was an error deleting the permission, please try again later.');
            this.deleteLoading$ = false;
          });
        }
      });
    }
  }

}
