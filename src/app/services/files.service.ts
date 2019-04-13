import { Injectable } from '@angular/core';
import {HttpClient, HttpEventType, HttpRequest, HttpResponse} from "@angular/common/http";
import {Observable, Subject} from "rxjs";
import {DomSanitizer} from "@angular/platform-browser";
import {map} from "rxjs/operators";

const url = 'https://core.vatpac.org/files';

@Injectable({
  providedIn: 'root'
})
export class FilesService {

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) { }

  public getImage(id: number | string) {
    return this.http.get(`${url}/${id}`, {
      responseType: 'blob',
      observe: 'response'
    })
      .pipe(
        map((res: any) => {
          const contentDispositionHeader = (res.headers.get('Content-Disposition').split(';')[1].trim().split('=')[1]).replace(/"/g, '');
          return {id: id, name: contentDispositionHeader, file: this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(res.body))};
        })
      );
  }

  public deleteImage(id: number | string) {
    return this.http.delete(`${url}/${id}`);
  }

  public upload(files: Set<{preview: string | ArrayBuffer, file: File}>):
    {[key:string]:Observable<any>} {

    // this will be the our resulting map
    const status = {};

    files.forEach(file => {
      // create a new multipart-form for every file
      const formData: FormData = new FormData();
      formData.append('file', file.file, file.file.name);

      // create a http-post request and pass the form
      // tell it to report the upload progress
      const req = new HttpRequest('POST', `${url}/upload`, formData, {
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

          // Close the progress-stream if we get an answer form the API
          // The upload is complete
          fileID.next(event.body['id']);
          fileID.complete();
          if (event.body['status'] !== 200) {
            progress.error('Failed');
          } else {
            progress.complete();
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
}
