import {Component, isDevMode, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {AlertService} from "../../../services/alert.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {UserService} from "../../../services/user.service";
import {ApiService} from "../../../services/api.service";
import {CoreResponse} from "../../../models/CoreResponse";
import {ApiListService} from "../../../services/api-list.service";

@Component({
  selector: 'app-api-key',
  templateUrl: './api-key.component.html',
  styleUrls: ['./api-key.component.scss']
})
export class ApiKeyComponent implements OnInit {

  apiKey = new FormGroup({
    name: new FormControl('', Validators.required),
    prefix: new FormControl(''),
    allowedIPs: new FormArray([this.allowedIPControl], Validators.required),
    scopes: new FormGroup({}, Validators.required)
  });

  id: string;
  key = '********************';
  @ViewChild('apiResultModal', {static: true}) apiResultModal: TemplateRef<any>;

  submitTxt = "Create API Key";
  loading$ = false;
  canSubmit$ = true;
  deleteLoading$ = false;
  objectKeys = Object.keys;

  constructor(private route: ActivatedRoute, private router: Router, private alertService: AlertService, private apiListService: ApiListService, private apiService: ApiService, private userService: UserService, private _modalService: NgbModal) {
    for (let perm of this.userService.currentUserValue.perms) {
      if (perm.level === 3) {
        const type = perm.perm.sku.split('.')[0];
        if (!this.scopes.contains(type)) this.scopes.addControl(type, new FormArray([]));
        this.getScopesArray(type).push(new FormGroup({
          id: new FormControl({value: perm.perm._id, disabled: true}),
          sku: new FormControl({value: perm.perm.sku, disabled: true}),
          description: new FormControl({value: perm.perm.description, disabled: true}),
          selected: new FormControl(false, Validators.required)
        }))
      }
    }

    this.id = this.route.snapshot.params.id;
    if (this.id) {
      this.apiService.getAPIKey(this.id).subscribe({
        next: res => {
          res = new CoreResponse(res);
          if (res.success()) {
            this.apiKey.get('name').setValue(res.body.apiKey.name);
            this.apiKey.get('prefix').setValue(res.body.apiKey.prefix);
            this.allowedIPs.controls = res.body.apiKey.allowedIPs.map(ip => new FormControl(ip, Validators.required));

            for (let type of Object.keys(this.scopes.controls)) {
              for (let scope of this.getScopesArray(type).controls) {
                if (res.body.apiKey.scopes.findIndex(p => p
                  && p.sku.toLowerCase() === scope.get('sku').value) !== -1) {
                  scope.get('selected').setValue(true);
                }
              }
            }

            this.allowedIPs.updateValueAndValidity();
          } else {
            this.alertService.add('danger', 'Error getting API Key Details');
            this.router.navigate(["/access/api"]);
          }
        }, error: err => {
          if (isDevMode()) console.log(err);
          this.alertService.add('danger', 'Error getting API Key Details');
          this.router.navigate(["/access/api"]);
        }
      })
    }
  }

  ngOnInit() {
  }

  get allowedIPControl() {
    return new FormControl('', [Validators.required, Validators.pattern(new RegExp('^((((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){1,3}\\*))|^\\*$', 'i'))]);
  }

  get scopes() {
    return this.apiKey.get('scopes') as FormGroup;
  }

  get allowedIPs() {
    return this.apiKey.get('allowedIPs') as FormArray;
  }

  getScopesArray(type) {
    return this.scopes.get(type) as FormArray;
  }

  markAllAs(type) {
    const allSelected = this.getScopesArray(type).controls.every(s => s.get('selected').value);
    console.log(allSelected);

    this.getScopesArray(type).controls.forEach(s => {
      s.get('selected').setValue(!allSelected);
    });
  }

  addIP() {
    this.allowedIPs.push(new FormControl('', Validators.required));
  }

  deleteAllowedIP(i) {
    if (this.allowedIPs.length !== 1) this.allowedIPs.removeAt(i);
  }

  submitAPIKey() {
    if (!this.apiKey.valid) return this.alertService.add('danger', 'One or more fields are invalid. Please correct them before trying again.');
    this.loading$ = true;

    const name = this.apiKey.get('name');
    let scopes = [];
    for (let type of Object.keys(this.scopes.controls)) {
      for (let perm of this.getScopesArray(type).controls) {
        if (perm.get('selected').value) scopes.push(perm.get('sku').value)
      }
    }

    this.allowedIPs.updateValueAndValidity();
    if (this.id) {
      this.apiService.updateAPIKey(this.id, name.value, this.allowedIPs.value, scopes).subscribe({
        next: res => {
          res = new CoreResponse(res);
          if (res.success()) {
            this.submitTxt = 'Saved';
            this.alertService.add('success', 'Updated API Key Successfully.');
            this.canSubmit$ = false;
            this.apiListService.refresh();
            this.router.navigate(['/access/api']);
          } else {
            this.alertService.add("danger","There was an error updating the API key.");
          }

          this.loading$ = false;
        }, error: err => {
          if (isDevMode()) console.log(err);
          this.alertService.add("danger","There was an error updating the API key.");
          this.loading$ = false;
        }
      })
    } else {
      this.apiService.createAPIKey(name.value, this.allowedIPs.value, scopes).subscribe({
        next: res => {
          res = new CoreResponse(res);
          if (res.success() && res.body.apiKey.key && res.body.apiKey.prefix) {
            this.submitTxt = 'Saved';
            this.alertService.add('success', 'Created API Key Successfully.');
            this.canSubmit$ = false;

            this.key = res.body.apiKey.prefix + '.' + res.body.apiKey.key;
            this._modalService.open(this.apiResultModal, {size: 'xl', centered: true, backdrop: 'static', ariaLabelledBy: 'api-result-modal'}).result.then(_ => {
              this.apiListService.refresh();
              this.router.navigate(['/access/api']);
            });
          } else {
            this.alertService.add("danger","There was an error creating the API key.");
          }

          this.loading$ = false;
        }, error: err => {
          if (isDevMode()) console.log(err);
          this.alertService.add("danger","There was an error creating the API key.");
          this.loading$ = false;
        }
      })
    }
  }

  deleteAPIKey(content) {
    if (this.id) {
      this._modalService.open(content, {ariaLabelledBy: 'confirm-delete-modal'}).result.then((result) => {
        if (result === 'okClick') {
          this.deleteLoading$ = true;

          this.apiService.deleteAPIKey(this.id).subscribe(res => {
            res = new CoreResponse(res);
            if (res.success()) {
              this.alertService.add('success', 'Deleted API Key Successfully.');

              this.apiListService.refresh();
              this.router.navigate(['/access/api']);
            } else {
              this.alertService.add('danger', 'There was an error deleting the API key, please try again later.');
            }
            this.deleteLoading$ = false;
          }, _ => {
            this.alertService.add('danger', 'There was an error deleting the API key, please try again later.');
            this.deleteLoading$ = false;
          });
        }
      });
    }
  }

}
