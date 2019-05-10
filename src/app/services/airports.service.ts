import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Airport} from "../models/airport";
import {Observable} from "rxjs";
import {CoreResponse} from "../models/CoreResponse";

const url = 'https://core.vatpac.org';

@Injectable({
  providedIn: 'root'
})
export class AirportsService {

  constructor(private http: HttpClient) { }

  public getAirports(): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(`${url}/flightData/airports`);
  }

  public getAirportICAOs() {
    return this.http.get(`${url}/flightData/airports/icaos`);
  }
}
