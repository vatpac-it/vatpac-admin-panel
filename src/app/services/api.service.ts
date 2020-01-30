import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {CoreResponse} from "../models/CoreResponse";
import {HttpClient} from "@angular/common/http";

const url = 'https://core.vatpac.org';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  public createAPIKey(name: string, allowedIPs: string[], scopes: string[]): Observable<CoreResponse> {
    return this.http.post<CoreResponse>(`${url}/api`, {name: name, allowedIPs: allowedIPs, scopes: scopes});
  }

  public updateAPIKey(id: string, name: string, allowedIPs: string[], scopes: string[]): Observable<CoreResponse> {
    return this.http.post<CoreResponse>(`${url}/api/${id}`, {name: name, allowedIPs: allowedIPs, scopes: scopes});
  }

  public getAPIKeys(): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(`${url}/api`);
  }

  public getAPIKey(id: string): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(`${url}/api/${id}`);
  }

  public deleteAPIKey(id: string): Observable<CoreResponse> {
    return this.http.delete<CoreResponse>(`${url}/api/${id}`);
  }
}
