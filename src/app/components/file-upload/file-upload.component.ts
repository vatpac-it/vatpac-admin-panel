import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {FilesService} from "../../services/files.service";
import {forkJoin} from "rxjs";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {take} from "rxjs/operators";
import {CoreResponse} from "../../models/CoreResponse";
import {AlertService} from "../../services/alert.service";
import {FormControl, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {
  @ViewChild('file', { static: true }) file;

  public files: Set<{preview: string | ArrayBuffer, file: File}> = new Set();

  @Input() path: string;
  @Input() additionalFields: FormGroup = new FormGroup({});
  @Input() imagesOnly: boolean = false;

  objectKeys = Object.keys;

  progress;
  canBeClosed = true;
  primaryButtonText = 'Close';
  showCancelButton = true;
  uploading = false;
  uploadSuccessful = false;
  uploadFailed = false;

  allowed = '';
  failedFields = [];

  public returnIds = [];

  constructor(public filesService: FilesService, public modal: NgbActiveModal, private alertService: AlertService) {
    this.filesService.allowed().pipe(take(1)).subscribe(res => {
      res = new CoreResponse(res);

      if (res.success()) {
        if (this.imagesOnly) res.body.allowed = res.body.allowed.filter(a => a.split('/')[0] === 'image');
        this.allowed = res.body.allowed.join(',');
      } else {
        this.alertService.add('danger', 'Error getting allowed file types.');
        this.modal.close(false);
      }
    }, error => {
      this.alertService.add('danger', 'Error getting allowed file types.');
      this.modal.close(false);
    });
  }

  ngOnInit() {

  }

  addFiles() {
    this.file.nativeElement.click();
  }

  onFilesAdded() {
    const files: { [key: string]: File } = this.file.nativeElement.files;
    if (Object.keys(files).length > 0) {
      this.primaryButtonText = 'Upload All';

      for (let key in files) {
        if (!isNaN(parseInt(key))) {
          const reader = new FileReader();
          reader.onload = e => this.files.add({preview: reader.result, file: files[key]});

          reader.readAsDataURL(files[key]);
        }
      }
    }
  }

  upload() {
    // if everything was uploaded already, just close the dialog
    if (this.uploadSuccessful || this.uploadFailed) {
      return this.modal.close(this.returnIds);
    }
    if (this.files.size === 0) {
      return this.modal.close(false);
    }

    this.additionalFields.updateValueAndValidity();
    if (this.additionalFields.valid) {
      // set the component state to "uploading"
      this.uploading = true;

      const data = this.additionalFields.getRawValue();
      for (const field of Object.keys(data)) {
        const parts = field.split('.');
        if (parts.length > 1) {
          data[parts[1]] = data[field];
          delete data[field];
        }
      }

      // start the upload and save the progress map
      this.progress = this.filesService.upload(this.files, data, this.path || 'files');

      // convert the progress map into an array
      let allProgressObservables = [];
      let allIdsObservables = [];
      for (let key in this.progress) {
        allProgressObservables.push(this.progress[key].progress);
        allIdsObservables.push(this.progress[key].id);
      }

      // Adjust the state variables

      // The OK-button should have the text "Finish" now
      this.primaryButtonText = 'Finish';

      // The dialog should not be closed while uploading
      this.canBeClosed = false;

      // Hide the cancel-button
      this.showCancelButton = false;

      // When all progress-observables are completed...
      forkJoin(allProgressObservables).subscribe(end => {
        // ... the dialog can be closed again...
        this.canBeClosed = true;

        // ... the upload was successful...
        this.uploadSuccessful = true;

        // ... and the component is no longer uploading
        this.uploading = false;
      }, err => {
        // ... the dialog can be closed again...
        this.canBeClosed = true;

        // ... the upload was successful...
        this.uploadFailed = true;

        // ... and the component is no longer uploading
        this.uploading = false;
      });

      for (let id of allIdsObservables) {
        id.subscribe(res => {
          this.returnIds.push(res);
        });
      }
    }
  }

}
