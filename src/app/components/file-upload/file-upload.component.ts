import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {FilesService} from "../../services/files.service";
import {BehaviorSubject, forkJoin, Observable, Subject} from "rxjs";
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
  @Input() maxFiles: number = 1;

  objectKeys = Object.keys;

  progress: BehaviorSubject<Number>[] = [];
  canBeClosed = true;
  primaryButtonText = 'Close';
  showCancelButton = true;
  uploading = false;
  uploadSuccessful = false;
  uploadFailed = false;

  allowed = '';

  public returnIds = [];
  public returnData = {};

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
    if (Object.keys(files).length > 0 && this.files.size < this.maxFiles) {
      this.primaryButtonText = 'Upload All';

      for (let key in files) {
        if (!isNaN(parseInt(key))) {
          const reader = new FileReader();
          reader.onload = e => this.files.add({preview: reader.result, file: files[key]});

          reader.readAsDataURL(files[key]);
        }
      }

      this.progress.push(new BehaviorSubject<Number>(0));
    }
  }

  upload() {
    // if everything was uploaded already, just close the dialog
    if (this.uploadSuccessful) {
      return this.modal.close({ids: this.returnIds, data: this.returnData});
    }
    if (this.files.size === 0) {
      return this.modal.close(false);
    }

    this.additionalFields.updateValueAndValidity();
    if (this.additionalFields.valid) {
      // set the component state to "uploading"
      this.uploading = true;

      this.returnData = this.additionalFields.getRawValue();
      for (const field of Object.keys(this.returnData)) {
        const parts = field.split('.');
        if (parts.length > 1) {
          this.returnData[parts[1]] = this.returnData[field];
          delete this.returnData[field];
        }
      }

      // start the upload and save the progress map
      // this.progress = this.filesService.upload(this.files, data, this.path || 'files');
      this.filesService.upload(this.files, {
        onsuccess: fileIds => {
          console.log(fileIds);
          // ... the dialog can be closed again...
          this.canBeClosed = true;

          // ... the upload was successful...
          this.uploadSuccessful = true;

          // ... and the component is no longer uploading
          this.uploading = false;

          this.returnIds = fileIds;
          this.alertService.add('success', `File${this.files.size > 1 ? 's' : ''} uploaded successfully!`);
          return this.modal.close({ids: this.returnIds, data: this.returnData});
        },
        onerror: errors => {
          console.log(errors);
          // ... the dialog can be closed again...
          this.canBeClosed = true;

          // ... the upload was successful...
          this.uploadFailed = true;

          this.alertService.add('danger', 'There was an error uploading a file');

          // ... and the component is no longer uploading
          this.uploading = false;
        },
        onfailure: errors => {
          console.log(errors);
          // ... the dialog can be closed again...
          this.canBeClosed = true;

          // ... the upload was unsuccessful...
          this.uploadFailed = true;

          this.alertService.add('danger', 'There was a fatal error uploading the file');

          // ... and the component is no longer uploading
          this.uploading = false;
        },
        onchunk: progress => {
          progress.forEach((p, i) => {
            this.progress[i].next(p*100);
          });
        }
      });

      // The OK-button should have the text "Finish" now
      this.primaryButtonText = 'Finish';

      // The dialog should not be closed while uploading
      this.canBeClosed = false;

      // Hide the cancel-button
      this.showCancelButton = false;
    }
  }

}
