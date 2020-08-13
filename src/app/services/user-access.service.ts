import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {CoreResponse} from "../models/CoreResponse";
import {Group} from "../models/User";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";

const url = environment.url;

@Injectable({
  providedIn: 'root'
})
export class UserAccessService {

  constructor(private http: HttpClient) { }

  public getUsers(): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(url + '/access/users');
  }

  public getUser(id: string): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(url + '/access/users/' + id);
  }

  public updateUser(id: string, primary: Group, secondary: Group[]): Observable<CoreResponse> {
    return this.http.patch<CoreResponse>(url + '/access/users/' + id, {primary: primary, secondary: secondary});
  }

  public createNote(id: string, content: string): Observable<CoreResponse> {
    return this.http.post<CoreResponse>(url + '/access/users/' + id + '/newnote', {note: {content: content}});
  }

  public editNote(id: string, note_id: string, content: string): Observable<CoreResponse> {
    return this.http.patch<CoreResponse>(url + '/access/users/' + id + '/editnote/' + note_id, {note: {content: content}});
  }

  public deleteNote(id: string, note_id: string): Observable<CoreResponse> {
    return this.http.delete<CoreResponse>(url + '/access/users/' + id + '/deletenote/' + note_id);
  }
}
