import {Injectable, PipeTransform} from '@angular/core';
import {API} from "../models/API";
import {SortDirection} from "../sortable-header/sortable-header.directive";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {DecimalPipe} from "@angular/common";
import {debounceTime, delay, map, switchMap, tap} from "rxjs/operators";
import {ApiService} from "./api.service";
import {CoreResponse} from "../models/CoreResponse";

interface SearchResult {
  apiKeys: API[];
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

function sort(apiKeys: API[], column: string, direction: string): API[] {
  if (direction === '') {
    return apiKeys;
  } else {
    return [...apiKeys].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(api: API, term: string, pipe: PipeTransform) {
  term = term.toLowerCase();
  return api.name.toLowerCase().includes(term)
    || api.prefix.toLowerCase().includes(term);
}

@Injectable({
  providedIn: 'root'
})
export class ApiListService {

  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _apiKeys$ = new BehaviorSubject<API[]>([]);
  private _total$ = new BehaviorSubject<number>(0);

  private _state: State = {
    page: 1,
    pageSize: 5,
    searchTerm: '',
    sortColumn: '',
    sortDirection: ''
  };

  constructor(private apiService: ApiService, private pipe: DecimalPipe) {
    this._search$.pipe(
      tap(() => this._loading$.next(true)),
      debounceTime(200),
      switchMap(() => this._search()),
      delay(200),
      tap(() => this._loading$.next(false))
    ).subscribe(result => {
      this._apiKeys$.next(result.apiKeys);
      this._total$.next(result.total);
    });

    this._search$.next();
  }

  get apiKeys$() { return this._apiKeys$.asObservable(); }
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

    return this.apiService.getAPIKeys().pipe(map(res => {
      res = new CoreResponse(res);

      if (!res.success()) {
        return {apiKeys: [], total: 0};
      }

      let keys = res.body.apiKeys as API[];

      // Set name field
      if (Array.isArray(keys)) {
        keys = keys.map(k => {
          k.allowedDomains = (k.allowedDomains as Array<string>).length.toString();
          k.scopes = (k.scopes as Array<string>).length.toString();
          return k;
        });

        // 1. sort
        let apiKeys = sort(keys, sortColumn, sortDirection);

        // 2. filter
        apiKeys = apiKeys.filter(apiKey => matches(apiKey, searchTerm, this.pipe));
        const total = apiKeys.length;

        // 3. paginate
        apiKeys = apiKeys.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

        return {apiKeys, total};
      } else {
        return {apiKeys: [], total: 0};
      }
    }));
  }

  public refresh() {
    this._search$.next();
  }
}
