import { Injectable } from '@angular/core';
import {HttpClient, HttpEventType, HttpRequest, HttpResponse} from "@angular/common/http";
import {Observable, Subject} from "rxjs";
import {DomSanitizer} from "@angular/platform-browser";
import {map} from "rxjs/operators";
import {CoreResponse} from "../models/CoreResponse";

const url = 'https://core.vatpac.org/';

@Injectable({
  providedIn: 'root'
})
export class FilesService {

  constructor(public http: HttpClient, private sanitizer: DomSanitizer) { }

  public getImage(id: number | string) {
    return this.http.get(`${url}/files/${id}`, {
      responseType: 'blob',
      observe: 'response'
    })
      .pipe(
        map((res: any) => {
          const contentDispositionHeader = (res.headers.get('Content-Disposition').split(';')[1].trim().split('=')[1]).replace(/"/g, '');
          return {_id: id, name: contentDispositionHeader, file: this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(res.body))};
        })
      );
  }

  public allowed() {
    return this.http.get<CoreResponse>(`${url}/files/allowed`);
  }

  public deleteImage(id: number | string) {
    return this.http.delete<CoreResponse>(`${url}/files/${id}`);
  }

  public upload(files: Set<{preview: string | ArrayBuffer, file: File}>, data: {[key: string]: string}, path = 'files'):
    {[key:string]:Observable<any>} {

    // this will be the our resulting map
    // this will be the our resulting map
    const status = {};

    files.forEach(file => {
      // create a new multipart-form for every file
      const formData: FormData = new FormData();
      formData.append('file', file.file, file.file.name);

      for (let key in data) {
        formData.append(key, data[key])
      }

      // create a http-post request and pass the form
      // tell it to report the upload progress
      const req = new HttpRequest('POST', `${url}${path}/upload`, formData, {
        reportProgress: true
      });

      // create a new progress-subject for every file
      const progress = new Subject<number>();

      var fileID = new Subject<string>();

      // send the http-request and subscribe for progress-updates
      this.http.request(req).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {

          // calculate the progress percentage
          const percentDone = Math.round(100 * event.loaded / event.total);

          // pass the percentage into the progress-stream
          progress.next(percentDone);
        } else if (event instanceof HttpResponse) {
          let res = event.body as CoreResponse;
          res = new CoreResponse(res);

          // Close the progress-stream if we get an answer form the API
          // The upload is complete
          if (res.success()) {
            fileID.next(res.body.location);
            fileID.complete();
            progress.complete();
          } else {
            progress.error('Failed');
            fileID.error('Failed');
          }
        }
      });

      // Save every progress-observable in a map of all observables
      status[file.file.name] = {
        progress: progress.asObservable(),
        id: fileID.asObservable()
      };
    });

    // return the map of progress.observables
    return status;
  }

  public mceUploadFile(blobInfo, success, failure) {
    const formData: FormData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());

    let xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST', `${url}files/upload`);

    xhr.onload = function() {
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
