import {Component, OnInit, ViewChild} from '@angular/core';
import {FilesService} from "../../services/files.service";
import {forkJoin} from "rxjs";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  @ViewChild('file') file;

  public files: Set<{preview: string | ArrayBuffer, file: File}> = new Set();

  progress;
  canBeClosed = true;
  primaryButtonText = 'Upload All';
  showCancelButton = true;
  uploading = false;
  uploadSuccessful = false;

  public returnIds = [];

  constructor(public filesService: FilesService, public modal: NgbActiveModal) { }

  addFiles() {
    this.file.nativeElement.click();
  }

  onFilesAdded() {
    const files: { [key: string]: File } = this.file.nativeElement.files;
    for (let key in files) {
      if (!isNaN(parseInt(key))) {
        const reader = new FileReader();
        reader.onload = e => this.files.add({preview: reader.result, file: files[key]});

        reader.readAsDataURL(files[key]);
      }
    }
  }

  upload() {
    // if everything was uploaded already, just close the dialog
    if (this.uploadSuccessful) {
      return this.modal.close(this.returnIds);
    }
    if (this.files.size === 0) {
      return this.modal.close(this.returnIds);
    }

    // set the component state to "uploading"
    this.uploading = true;

    // start the upload and save the progress map
    this.progress = this.filesService.upload(this.files);

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
    });

    for (let id of allIdsObservables) {
      id.subscribe(res => {
        this.returnIds.push(res);
      });
    }
  }

}
