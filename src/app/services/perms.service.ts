import {Injectable, PipeTransform} from '@angular/core';
import {Perm} from "../models/User";
import {SortDirection} from "../sortable-header/sortable-header.directive";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {DecimalPipe} from "@angular/common";
import {debounceTime, delay, map, switchMap, tap} from "rxjs/operators";
import {CoreResponse} from "../models/CoreResponse";

const url = 'https://core.vatpac.org';

interface SearchResult {
  perms: Perm[];
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

function sort(perms: Perm[], column: string, direction: string): Perm[] {
  if (direction === '') {
    return perms;
  } else {
    return [...perms].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(perm: Perm, term: string, pipe: PipeTransform) {
  term = term.toLowerCase();
  return perm.sku.toLowerCase().includes(term)
    || perm.name.toLowerCase().includes(term)
    || perm.description.toLowerCase().includes(term);
}

@Injectable({
  providedIn: 'root'
})
export class PermsService {

  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _perms$ = new BehaviorSubject<Perm[]>([]);
  private _total$ = new BehaviorSubject<number>(0);

  private _state: State = {
    page: 1,
    pageSize: 10,
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
      this._perms$.next(result.perms);
      this._total$.next(result.total);
    });

    this._search$.next();
  }

  public getPerms(): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(url + '/access/perms');
  }

  public getPerm(sku: string): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(url + '/access/perms/' + sku);
  }

  public createPerm(sku: string, name: string, description: string): Observable<CoreResponse> {
    return this.http.post<CoreResponse>(url + '/access/perms/', {sku: sku, name: name, description: description});
  }

  public editPerm(sku: string, name: string, description: string): Observable<CoreResponse> {
    return this.http.patch<CoreResponse>(url + '/access/perms/' + sku, {name: name, description: description});
  }

  public deletePerm(sku: string): Observable<CoreResponse> {
    return this.http.delete<CoreResponse>(url + '/access/perms/' + sku);
  }

  get perms$() { return this._perms$.asObservable(); }
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

    return this.getPerms().pipe(map(res => {
      res = new CoreResponse(res);
      if (!res.success()) {
        return {perms: [], total: 0};
      }

      let p = res.body.perms as Perm[];

      // Set name field
      if (Array.isArray(p)) {
        // 1. sort
        let perms = sort(p, sortColumn, sortDirection);

        // 2. filter
        perms = perms.filter(perm => matches(perm, searchTerm, this.pipe));
        const total = perms.length;

        // 3. paginate
        perms = perms.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

        return {perms, total};
      } else {
        return {perms: [], total: 0};
      }
    }));
  }

  public refresh() {
    this._search$.next();
  }
}
