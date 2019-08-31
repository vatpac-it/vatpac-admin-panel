import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ClientService} from "../../services/client.service";
import {Observable} from "rxjs";
import {AlertService} from "../../services/alert.service";
import {Client} from "../../models/Client";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {FileUploadComponent} from "../../components/file-upload/file-upload.component";
import {FilesService} from "../../services/files.service";
import {CoreResponse} from "../../models/CoreResponse";
import {FormArray, FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.scss']
})
export class ClientComponent implements OnInit {

  sku: string;
  model: Observable<Client>;
  versionToDelete: string;

  client = new FormGroup({
    name: new FormControl('', Validators.required),
    sku: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    versions: new FormArray([])
  });

  submitTxt = "Create Client";
  loading$ = false;
  canSubmit$ = true;
  deleteLoading$ = false;

  constructor(private clientService: ClientService, private fileService: FilesService, private _modalService: NgbModal, private route: ActivatedRoute, public router: Router, private alertService: AlertService) { }

  ngOnInit() {
    this.sku = this.route.snapshot.params['sku'];
    if (this.sku) {
      this.getClient();
    }

  }

  getClient() {
    let set = false;
    this.clientService.getClient(this.sku).subscribe(res => {
      res = new CoreResponse(res);
      if (!res.success()) {
        this.alertService.add('danger', 'Error - Could not load client: Unable to load client, please try again.');
        this.router.navigate(['/clients']);
        return {};
      }

      this.client.controls['name'].setValue(res.body.client.name);
      this.client.controls['sku'].setValue(res.body.client.sku);
      this.client.controls['description'].setValue(res.body.client.description);

      res.body.client.versions.forEach((version) => {
        this.versions.push(new FormGroup({
          number: new FormControl({value: version.number, disabled: true}),
          created: new FormControl({value: this.formatDate(version.created), disabled: true})
        }));
      });

      this.submitTxt = "Save Client";

      set = true;

      return res.body.client;
    });

    let this$ = this;
    setTimeout(function () {
      if (!set) {
        this$.alertService.add('danger', 'Error getting client');
        this$.router.navigate(['/clients']);
      }
    }, 3000);
  }

  get versions() {
    return this.client.get('versions') as FormArray;
  }

  updateClient() {
    let name = this.client.controls['name'];
    let sku = this.client.controls['sku'];
    let description = this.client.controls['description'];

    if (!name.valid || !sku.valid || !description.valid) return this.alertService.add('danger', 'One or more fields are invalid. Please correct them before trying again.');

    this.loading$ = true;

    if (this.sku) {
      this.clientService.updateClient(sku.value, name.value, description.value).subscribe(res => {
        res = new CoreResponse(res);
        if (res.success()) {
          this.submitTxt = 'Saved';

          this.canSubmit$ = false;

          let this$ = this;
          setTimeout(function () {
            this$.alertService.add('success', 'Successfully updated client');
            this$.router.navigate(['/clients']);
          }, 1000);
        } else {
          this.alertService.add('danger', res.request.message);
        }
        this.loading$ = false;
      });
    } else {
      this.clientService.createClient(sku.value, name.value, description.value).subscribe(res => {
        res = new CoreResponse(res);
        if (res.success()) {
          this.submitTxt = 'Saved';

          this.canSubmit$ = false;

          let this$ = this;
          setTimeout(function () {
            this$.alertService.add('success', 'Successfully created client');
            this$.router.navigate(['/clients']);
          }, 1000);
        } else {
          this.alertService.add('danger', res.request.message);
        }
        this.loading$ = false;
      });
    }
  }

  deleteVersion(version, content) {
    this.versionToDelete = version;

    this._modalService.open(content, {ariaLabelledBy: 'delete-modal'}).result.then((result) => {
      if (result === 'okClick') {
        this.clientService.deleteClientVersion(this.sku, version).subscribe(res => {
          res = new CoreResponse(res);
          if (res.success()) {
            this.getClient();
          } else {
            console.log('ERROR');
            this.alertService.add('danger', 'Error - Could not delete version: ' + version);
          }
        });
      }
    });
  }

  deleteClient() {
    if (this.sku) {
      this.deleteLoading$ = true;

      this.clientService.deleteClient(this.sku).subscribe(res => {
        res = new CoreResponse(res);
        if (res.success()) {
          this.alertService.add('success', 'Deleted Client Successfully.');

          this.router.navigate(['/clients']);
        } else {
          this.alertService.add('danger', 'There was an error deleting the client, please try again later.');
        }
        this.deleteLoading$ = false;
      });
    }
  }

  openUpload() {
    const modalRef = this._modalService.open(FileUploadComponent, {ariaLabelledBy: 'confirm-delete-modal', centered: true});
    modalRef.componentInstance.path = 'client/' + this.sku;
    modalRef.componentInstance.additionalFields = {version: ''};
    modalRef.result.then((result) => {
      if (result.length === 0) {
        this.alertService.add('danger', 'Error - Could not upload version');
      } else if (result.length > 0) {
        this.getClient();
      }
    });
  }

  formatDate(date: string) {
    let d = new Date(date);

   return d.toLocaleString('en-AU');
  }

}
