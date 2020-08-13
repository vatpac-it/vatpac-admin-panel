import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ClientService} from "../../../services/client.service";
import {AlertService} from "../../../services/alert.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {FilesService} from "../../../services/files.service";
import {CoreResponse} from "../../../models/CoreResponse";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {FileUploadComponent} from "../../../components/file-upload/file-upload.component";

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.scss']
})
export class ClientComponent implements OnInit {

  id: string;
  versionToDelete: string;

  client = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required)
  });

  versions: { number: string, created: string, signature: string, download: string }[] = [];

  submitTxt = "Create Client";
  loading$ = false;
  canSubmit$ = true;
  deleteLoading$ = false;

  constructor(private clientService: ClientService, private fileService: FilesService, private _modalService: NgbModal, private route: ActivatedRoute, public router: Router, private alertService: AlertService) {
  }

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    if (this.id) {
      this.getClient();
    }

  }

  getClient() {
    let set = false;
    this.clientService.getClient(this.id).subscribe(res => {
      res = new CoreResponse(res);
      if (!res.success()) {
        this.alertService.add('danger', 'Error - Could not load client: Unable to load client, please try again.');
        this.router.navigate(['/operations/clients']);
        return;
      }

      this.client.controls['name'].setValue(res.body.client.name);
      this.client.controls['description'].setValue(res.body.client.description);

      this.versions = [];
      res.body.client.versions.forEach((version) => {
        this.versions.push({
          number: version.number,
          created: this.formatDate(version.created),
          signature: version.file ? version.file.signature || null : null,
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
    let description = this.client.controls['description'];

    if (!name.valid || !description.valid) return this.alertService.add('danger', 'One or more fields are invalid. Please correct them before trying again.');

    this.loading$ = true;

    if (this.id) {
      this.clientService.updateClient(this.id, name.value, description.value).subscribe(res => {
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
      this.clientService.createClient(name.value, description.value).subscribe(res => {
        res = new CoreResponse(res);
        if (res.success()) {
          this.submitTxt = 'Saved';

          this.canSubmit$ = false;

          let this$ = this;
          setTimeout(function () {
            this$.alertService.add('success', 'Successfully created client');
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
    }
  }

  deleteVersion(version, content) {
    this.versionToDelete = version.number;
    const index = this.versions.findIndex(v => v.number === version.number);
    if (index === -1) return this.alertService.add('danger', 'Error deleteing version');

    this._modalService.open(content, {ariaLabelledBy: 'delete-modal'}).result.then((result) => {
      if (result === 'okClick') {
        this.clientService.deleteClientVersion(this.id, version.number).subscribe(res => {
          res = new CoreResponse(res);
          if (res.success()) {
            this.alertService.add('success', 'Version Deleted');
            this.versions.splice(index, 1);
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
    if (this.id) {
      this.deleteLoading$ = true;

      this.clientService.deleteClient(this.id).subscribe(res => {
        res = new CoreResponse(res);
        if (res.success()) {
          this.alertService.add('success', 'Deleted Client Successfully.');
          this.clientService.refresh();
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
    if (!this.id) return this.alertService.add('danger', 'You can only upload versions after the client is created.');

    const modalRef = this._modalService.open(FileUploadComponent, {
      backdrop: 'static',
      ariaLabelledBy: 'confirm-delete-modal',
      centered: true
    });
    modalRef.componentInstance.additionalFields.controls = {
      version: new FormControl('', [Validators.required, Validators.maxLength(30)]),
      'large.changes': new FormControl('', [Validators.required, Validators.maxLength(512)])
    };
    modalRef.result.then((result) => {
      const {ids, data} = result;
      if (ids.length === 0) {
        this.alertService.add('danger', 'Error - Could not upload version');
      } else if (ids.length > 0) {
        if (!data.hasOwnProperty('version') || !data.hasOwnProperty('changes')) {
          return this.alertService.add('danger', 'Error with provided inputs');
        }

        this.clientService.uploadClient(this.id, ids[0], data.version, data.changes).subscribe({
          next: res => {
            res = new CoreResponse(res);
            if (!res.success()) {
              this.alertService.add('danger', res.request.message)
            }

            this.getClient();
          }, error: err => {
            this.alertService.add('danger', 'The file was uploaded but there was an error associating it.')
          }
        })
      }
    });
  }

  copyMessage(val: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);

    this.alertService.add('info', 'Copied to clipboard');
  }

  formatDate(date: string) {
    let d = new Date(date);

    return d.toLocaleString('en-AU');
  }

}
