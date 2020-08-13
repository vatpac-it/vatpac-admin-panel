import {Injectable, PipeTransform} from '@angular/core';
import {SortDirection} from "../sortable-header/sortable-header.directive";
import {NOTAM} from "../models/NOTAM";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {DecimalPipe} from "@angular/common";
import {debounceTime, delay, map, switchMap, tap} from "rxjs/operators";
import {CoreResponse} from "../models/CoreResponse";
import {HttpClient} from "@angular/common/http";
import {User} from "../models/User";

const url = 'https://core.vatpac.org/notams';

interface SearchResult {
  notams: NOTAM[];
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

function sort(notams: NOTAM[], column: string, direction: string): NOTAM[] {
  if (direction === '') {
    return notams;
  } else {
    return [...notams].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(notam: NOTAM, term: string, pipe: PipeTransform) {
  term = term.toLowerCase();
  return (notam.title || '').toLowerCase().includes(term)
    || (notam.start as string).toLowerCase().includes(term)
    || (notam.end as string).toLowerCase().includes(term)
    || notam.type.toLowerCase().includes(term)
    || notam.author.toString().toLowerCase().includes(term);
}

@Injectable({
  providedIn: 'root'
})
export class NotamsService {

  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _notams$ = new BehaviorSubject<NOTAM[]>([]);
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
      this._notams$.next(result.notams);
      this._total$.next(result.total);
    });

    this._search$.next();
  }

  public getNOTAMS(): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(url);
  }

  public getNOTAM(id: string): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(`${url}/${id}`);
  }

  public getTypes(): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(`${url}/types`);
  }

  public createNOTAM(notam): Observable<CoreResponse> {
    return this.http.post<CoreResponse>(`${url}/`, {notam: notam});
  }

  public editNOTAM(id: string, notam): Observable<CoreResponse> {
    return this.http.patch<CoreResponse>(`${url}/${id}`, {notam: notam});
  }

  public deleteNOTAM(id: string): Observable<CoreResponse> {
    return this.http.delete<CoreResponse>(`${url}/${id}`);
  }



  get notams$() { return this._notams$.asObservable(); }
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

    return this.getNOTAMS().pipe(map(res => {
      res = new CoreResponse(res);
      if (!res.success()) {
        return {notams: [], total: 0};
      }

      let n = res.body.notams as NOTAM[];

      // Set name field
      if (Array.isArray(n)) {
        n = n.map(notam => {
          notam.author = notam.author as User;
          notam.author = notam.author.first_name && notam.author.last_name ? notam.author.first_name + ' ' + notam.author.last_name : notam.author.first_name;
          notam.start = notam.start instanceof Date ? (notam.start.getTime()/1000).toString() : (new Date(notam.start).getTime()/1000).toString();
          notam.end = notam.end instanceof Date ? (notam.end.getTime()/1000).toString() : (new Date(notam.end).getTime()/1000).toString();
          if (notam.type) notam.type = notam.type.replace('-', ' ').split(' ').map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase() ).join(' ');

          return notam;
        });

        // 1. sort
        let notams = sort(n, sortColumn, sortDirection);

        notams = notams.map(notam => {
          notam.start = (new Date(parseInt(notam.start as string) * 1000)).toUTCString();
          notam.end = (new Date(parseInt(notam.end as string) * 1000)).toUTCString();

          return notam;
        });

        // 2. filter
        notams = notams.filter(notam => matches(notam, searchTerm, this.pipe));
        const total = notams.length;

        // 3. paginate
        notams = notams.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

        return {notams, total};
      } else {
        return {notams: [], total: 0};
      }
    }));
  }

  public refresh() {
    this._search$.next();
  }
}
