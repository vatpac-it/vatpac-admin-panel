import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {forkJoin, Observable, Subject} from "rxjs";
import {DomSanitizer} from "@angular/platform-browser";
import {map} from "rxjs/operators";
import {CoreResponse} from "../models/CoreResponse";
import {AlertService} from "./alert.service";
import {WebsocketService} from "./websocket.service";

const url = 'https://core.vatpac.org/';
const uploadSocket_URL = 'wss://core.vatpac.org/files/upload';

@Injectable({
  providedIn: 'root'
})
export class FilesService {

  constructor(public http: HttpClient, private sanitizer: DomSanitizer, private alertService: AlertService, private wsService: WebsocketService) {
  }

  public getImage(id: number | string) {
    return this.http.get(`${url}/files/${id}`, {
      responseType: 'blob',
      observe: 'response'
    })
      .pipe(
        map((res: any) => {
          const contentDispositionHeader = (res.headers.get('Content-Disposition').split(';')[1].trim().split('=')[1]).replace(/"/g, '');
          return {
            _id: id,
            name: contentDispositionHeader,
            file: this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(res.body))
          };
        })
      );
  }

  public allowed() {
    return this.http.get<CoreResponse>(`${url}/files/allowed`);
  }

  public deleteImage(id: number | string) {
    return this.http.delete<CoreResponse>(`${url}/files/${id}`);
  }

  public upload(files: Set<{ preview: string | ArrayBuffer, file: File }>, callbacks: {[key: string]: Function} = {}) {
    //
    // // this will be the our resulting map
    // // this will be the our resulting map
    // const status = {};

    const chunksize = 250000;
    let error_messages = [];
    let fileIds = [];
    let doneCalled = false;

    let fileService: Subject<any> = <Subject<any>>this.wsService.connect(uploadSocket_URL);

    function done() {
      console.log('Complete');
      if (!doneCalled) {
        doneCalled = true;
        if (fileIds.length > 0) {
          if (callbacks.hasOwnProperty('onsuccess')) {
            callbacks.onsuccess(fileIds);
          }
          if (fileIds.length !== files.size) {
            console.log('One or more files failed');
          }
          return;
        }

        if (error_messages.length === 0) {
          error_messages[0] = {error: 'Unknown Upload Error'};
        }

        if (callbacks.hasOwnProperty('onfailure')) {
          callbacks.onfailure(error_messages);
        } else {
          console.log(error_messages);
        }
      }
    }

    processFiles().then(() => {
      done();
      fileService.asObservable().subscribe({
        complete: done
      });
    }).catch(err => {
      if (callbacks.hasOwnProperty('onerror')) {
        callbacks.onerror(err);
      } else {
        console.log(err);
      }
    });

    async function processFiles() {
      let progress = [];

      const filesArray = Array.from(files);
      for (let i in filesArray) {
        const file = filesArray[i];
        progress.push(0);

        await new Promise((resolve, reject) => {
          if (fileService.closed) return reject();

          console.log('Started processing', file.file.name);
          let slice_start = 0;
          const end = file.file.size;
          let finished = false;

          const fileData = {
            name: file.file.name,
            size: file.file.size,
            type: file.file.type,
            lastModified: file.file.lastModified
          };

          const fileReader = new FileReader();
          fileReader.onload = function () {
            const fileBuffer = fileReader.result;

            fileService.next(JSON.stringify(fileData));

            fileService.subscribe({
              next: e => {
                const response = JSON.parse(e.data);
                console.log(response);

                if (response.fileId) {
                  if (response.close) {
                    fileService.complete();
                  }
                  if (finished && response.fileId) fileIds.push(response.fileId);
                  resolve();
                  return;
                }

                if (response.error) {
                  if (callbacks.hasOwnProperty('onerror')) {
                    callbacks.onerror(response);
                  }

                  error_messages.push(response);
                  if (response.fatal) {
                    fileService.complete();
                  }
                  reject();
                  return;
                }

                if (!response.ready) {
                  return;
                }

                if (finished) {
                  const doc = {finished: true};
                  if (parseInt(i) < files.size-1) doc['moreFiles'] = true;
                  fileService.next(JSON.stringify(doc));
                  return;
                }

                let slice_end = slice_start + (response.chunksize || chunksize);
                if (slice_end >= end) {
                  slice_end = end;
                  finished = true;
                }
                fileService.next(fileBuffer.slice(slice_start, slice_end));
                progress[parseInt(i)] = slice_end / end;
                if (callbacks.hasOwnProperty('onchunk')) {
                  callbacks.onchunk(progress);
                }
                slice_start = slice_end;
                return;
              }
            });
          };
          fileReader.readAsArrayBuffer(file.file);
        });
      }
    }

    // files.forEach(file => {
    //   // create a new multipart-form for every file
    //   const formData: FormData = new FormData();
    //   formData.append('file', file.file, file.file.name);
    //
    //   for (let key in data) {
    //     formData.append(key, data[key])
    //   }
    //
    //   // create a http-post request and pass the form
    //   // tell it to report the upload progress
    //   const req = new HttpRequest('POST', `${url}${path}/upload`, formData, {
    //     reportProgress: true
    //   });
    //
    //   // create a new progress-subject for every file
    //   const progress = new Subject<number>();
    //
    //   var fileID = new Subject<string>();
    //
    //   // send the http-request and subscribe for progress-updates
    //   this.http.request(req).subscribe(event => {
    //     if (event.type === HttpEventType.UploadProgress) {
    //
    //       // calculate the progress percentage
    //       const percentDone = Math.round(100 * event.loaded / event.total);
    //
    //       // pass the percentage into the progress-stream
    //       progress.next(percentDone);
    //     } else if (event instanceof HttpResponse) {
    //       let res = event.body as CoreResponse;
    //       res = new CoreResponse(res);
    //
    //       // Close the progress-stream if we get an answer form the API
    //       // The upload is complete
    //       if (res.success()) {
    //         fileID.next(res.body.location);
    //         fileID.complete();
    //         progress.complete();
    //       } else {
    //         progress.error('Failed');
    //         fileID.error('Failed');
    //       }
    //     }
    //   }, error => {
    //     progress.error('Failed');
    //     fileID.error('Failed');
    //     this.alertService.add('danger', 'Error uploading the file, please try again later.');
    //   });
    //
    //   // Save every progress-observable in a map of all observables
    //   status[file.file.name] = {
    //     progress: progress.asObservable(),
    //     id: fileID.asObservable()
    //   };
    // });
    //
    // // return the map of progress.observables
    // return status;
  }1

  public mceUploadFile(blobInfo, success, failure) {
    const formData: FormData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());

    let xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST', `${url}files/upload`);

    xhr.onload = function () {
      if (xhr.status != 200) {
        failure('HTTP Error: ' + xhr.status);
        return;
      }

      console.log(xhr);

      let res = new CoreResponse(JSON.parse(xhr.responseText));

      console.log(res);
      if (!res.success()) failure(res.request.message);

      success(res.body.location);
    };

    xhr.send(formData);
  }
}
