import {Injectable, PipeTransform} from '@angular/core';
import {HttpClient, HttpEventType, HttpRequest, HttpResponse} from "@angular/common/http";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {CoreResponse} from "../models/CoreResponse";
import {debounceTime, delay, map, switchMap, tap} from "rxjs/operators";
import {of} from "rxjs/internal/observable/of";
import {Airport} from "../models/Airport";
import {SortDirection} from "../sortable-header/sortable-header.directive";
import {DecimalPipe} from "@angular/common";

const url = 'https://core.vatpac.org';

interface SearchResult {
  airports: Airport[];
  total: number;
}

interface State {
  page: number;
  pageSize: number;
  searchTerm: string;
  sortColumn: string;
  sortDirection: SortDirection;
}

function compare(v1, v2) {
  return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
}

function sort(airports: Airport[], column: string, direction: string): Airport[] {
  if (direction === '') {
    return airports;
  } else {
    return [...airports].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(airport: Airport, term: string, pipe: PipeTransform) {
  term = term.toLowerCase();
  return airport._id.toLowerCase().includes(term)
    || airport.icao.toLowerCase().includes(term)
    || (airport.apName || '').toLowerCase().includes(term)
    || (airport.city || '').toLowerCase().includes(term)
    || (airport.country || '').toLowerCase().includes(term);
}

@Injectable({
  providedIn: 'root'
})
export class AirportsService {

  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _airports$ = new BehaviorSubject<Airport[]>([]);
  private _total$ = new BehaviorSubject<number>(0);

  private _state: State = {
    page: 1,
    pageSize: 5,
    searchTerm: '',
    sortColumn: '',
    sortDirection: ''
  };

  constructor(private http: HttpClient, private pipe: DecimalPipe) {
    this._search$.pipe(
      tap(() => this._loading$.next(true)),
      debounceTime(200),
      switchMap(() => this._search()),
      delay(200),
      tap(() => this._loading$.next(false))
    ).subscribe(result => {
      this._airports$.next(result.airports);
      this._total$.next(result.total);
    });

    this._search$.next();
  }

  public getAirports(): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(`${url}/flightData/airports`);
  }

  public getAirport(id: string): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(`${url}/flightData/airports/${id}`);
  }

  public updateAirport(id: string, airport: Airport): Observable<CoreResponse> {
    return this.http.post<CoreResponse>(`${url}/flightData/airports/${id}`, airport);
  }

  public getAirportsMin(): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(`${url}/flightData/airports/min`);
  }

  public getAirportICAOs(): Observable<String[]> {
    let local = localStorage.getItem('airportICAOS');
    if (local !== null) {
      return of(JSON.parse(local));
    } else {
      return this.http.get(`${url}/flightData/airports/icaos`).pipe(map(res => {
        let response = new CoreResponse(res);
        if (response.success()) {
          localStorage.setItem('airportICAOS', JSON.stringify(response.body.icaos));
          return response.body.icaos;
        }

        return []
      }));
    }
  }

  public getAirportPositions(): Observable<String[]> {
    let local = localStorage.getItem('airportPositions');
    if (local !== null) {
      return of(JSON.parse(local));
    } else {
      return this.http.get(`${url}/flightData/positions`).pipe(map(res => {
        let response = new CoreResponse(res);
        if (response.success()) {
          localStorage.setItem('airportPositions', JSON.stringify(response.body.positions));
          return response.body.positions;
        }

        return []
      }));
    }
  }

  public importAirport(file: File) {

    // create a new multipart-form for every file
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);

    // create a http-post request and pass the form
    // tell it to report the upload progress
    const req = new HttpRequest('POST', `${url}/flightData/airports/import`, formData, {
      reportProgress: true
    });

    // create a new progress-subject for every file
    const progress = new Subject<number>();

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
          progress.complete();
        } else {
          progress.error('Failed');
        }
      }
    }, error => {
      progress.error('Failed');
    });

    return progress.asObservable();
  }

  get airports$() { return this._airports$.asObservable(); }
  get total$() { return this._total$.asObservable(); }
  get loading$() { return this._loading$.asObservable(); }
  get page() { return this._state.page; }
  get pageSize() { return this._state.pageSize; }
  get searchTerm() { return this._state.searchTerm; }

  set page(page: number) { this._set({page}); }
  set pageSize(pageSize: number) { this._set({pageSize}); }
  set searchTerm(searchTerm: string) { this._set({searchTerm}); }
  set sortColumn(sortColumn: string) { this._set({sortColumn}); }
  set sortDirection(sortDirection: SortDirection) { this._set({sortDirection}); }

  private _set(patch: Partial<State>) {
    Object.assign(this._state, patch);
    this._search$.next();
  }

  private _search(): Observable<SearchResult> {
    const {sortColumn, sortDirection, pageSize, page, searchTerm} = this._state;

    return this.getAirportsMin().pipe(map(res => {
      if (res.request.result === 'failed') {
        return {airports: [], total: 0};
      }

      let us = res.body.airports as Airport[];

      // Set name field
      if (Array.isArray(us)) {
        // 1. sort
        let airports = sort(us, sortColumn, sortDirection);

        // 2. filter
        airports = airports.filter(airport => matches(airport, searchTerm, this.pipe));
        const total = airports.length;

        // 3. paginate
        airports = airports.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

        return {airports, total};
      } else {
        return {airports: [], total: 0};
      }
    }));
  }

  public refresh() {
    this._search$.next();
  }
}
