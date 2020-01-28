import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ClientService} from "../../../services/client.service";
import {Observable} from "rxjs";
import {AlertService} from "../../../services/alert.service";
import {Client} from "../../../models/Client";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {FilesService} from "../../../services/files.service";
import {CoreResponse} from "../../../models/CoreResponse";
import {FormArray, FormControl, FormGroup, Validators} from "@angular/forms";
import {FileUploadComponent} from "../../../components/file-upload/file-upload.component";

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.scss']
})
export class ClientComponent implements OnInit {

  sku: string;
  versionToDelete: string;

  client = new FormGroup({
    name: new FormControl('', Validators.required),
    sku: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required)
  });

  versions: {number: string, created: string, signature: string, download: string}[] = [];

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
        this.router.navigate(['/operations/clients']);
        return;
      }

      this.client.controls['name'].setValue(res.body.client.name);
      this.client.controls['sku'].setValue(res.body.client.sku);
      this.client.controls['description'].setValue(res.body.client.description);

      this.versions = [];
      res.body.client.versions.forEach((version) => {
        this.versions.push({
          number: version.number,
          created: this.formatDate(version.created),
          signature: version.file.signature || null,
          download: version.file ? `https://core.vatpac.org/files/${version.file._id}` : null
        });
      });

      this.submitTxt = "Save Client";

      set = true;

      return res.body.client;
    }, error => {
      this.alertService.add('danger', 'Error - Could not load client: Unable to load client, please try again.');
      this.router.navigate(['/operations/clients']);
    });

    let this$ = this;
    setTimeout(function () {
      if (!set) {
        this$.alertService.add('danger', 'Error getting client');
        this$.router.navigate(['/operations/clients']);
      }
    }, 3000);
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

            this$.clientService.refresh();
            this$.router.navigate(['/operations/clients']);
          }, 1000);
        } else {
          this.alertService.add('danger', res.request.message);
        }
        this.loading$ = false;
      }, error => {
        this.loading$ = false;
        this.alertService.add('danger', error.error.request.message);
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
            this$.router.navigate(['/operations/clients']);
          }, 1000);
        } else {
          this.alertService.add('danger', res.request.message);
        }
        this.loading$ = false;
      }, error => {
        this.loading$ = false;
        this.alertService.add('danger', error.error.request.message);
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
            this.alertService.add('danger', 'Error - Could not delete version: ' + version);
          }
        }, error => {
          this.alertService.add('danger', 'Error - Could not delete version: ' + version);
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

          this.router.navigate(['/operations/clients']);
        } else {
          this.alertService.add('danger', 'There was an error deleting the client, please try again later.');
        }
        this.deleteLoading$ = false;
      }, error => {
        this.deleteLoading$ = false;
        this.alertService.add('danger', 'There was an error deleting the client, please try again later.');
      });
    }
  }

  openUpload() {
    const modalRef = this._modalService.open(FileUploadComponent, {ariaLabelledBy: 'confirm-delete-modal', centered: true});
    modalRef.componentInstance.path = 'client/' + this.sku;
    modalRef.componentInstance.additionalFields.controls = {
      version: new FormControl('', [Validators.required, Validators.maxLength(30)]),
      'large.changes': new FormControl('', [Validators.required, Validators.maxLength(512)])
    };
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
