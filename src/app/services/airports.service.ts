import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Airport} from "../models/airport";
import {Observable} from "rxjs";

const url = 'https://core.vatpac.org';

@Injectable({
  providedIn: 'root'
})
export class AirportsService {

  constructor(private http: HttpClient) { }

  public getAirports(): Observable<Airport> {
    return this.http.get<Airport>(`${url}/flightData/airports`);
  }

  public getAirportICAOs() {
    return this.http.get(`${url}/flightData/airports/icaos`);
  }
}
