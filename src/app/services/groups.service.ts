import {Injectable, PipeTransform} from '@angular/core';
import {Group} from "../models/User";
import {SortDirection} from "../sortable-header/sortable-header.directive";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {DecimalPipe} from "@angular/common";
import {CoreResponse} from "../models/CoreResponse";
import {debounceTime, delay, map, switchMap, tap} from "rxjs/operators";

const url = 'https://core.vatpac.org';

interface SearchResult {
  groups: Group[];
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

function sort(groups: Group[], column: string, direction: string): Group[] {
  if (direction === '') {
    return groups;
  } else {
    return [...groups].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(group: Group, term: string, pipe: PipeTransform) {
  term = term.toLowerCase();
  return group.name.toLowerCase().includes(term)
    || group.colour.toLowerCase().includes(term);
}

@Injectable({
  providedIn: 'root'
})
export class GroupsService {

  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _groups$ = new BehaviorSubject<Group[]>([]);
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
      this._groups$.next(result.groups);
      this._total$.next(result.total);
    });

    this._search$.next();
  }

  public getGroups(): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(url + '/access/groups');
  }

  public getGroup(id: string): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(url + '/access/groups/' + id);
  }

  public createGroup(name: string, colour: string, staff: boolean, inherit: string[], perms: {perm: string, level: number}[]): Observable<CoreResponse> {
    return this.http.post<CoreResponse>(url + '/access/groups/', {name: name, colour: colour, staff: staff, inherit: inherit, perms: perms});
  }

  public editGroup(_id: string, name: string, colour: string, staff: boolean, inherit: string[], perms: {perm: string, level: number}[]): Observable<CoreResponse> {
    return this.http.patch<CoreResponse>(url + '/access/groups/' + _id, {name: name, colour: colour, staff: staff, inherit: inherit, perms: perms});
  }

  public updateGroupOrder(order: string[]): Observable<CoreResponse> {
    return this.http.post<CoreResponse>(url + '/access/groups/order', {order: order});
  }

  public deleteGroup(_id: string): Observable<CoreResponse> {
    return this.http.delete<CoreResponse>(url + '/access/groups/' + _id);
  }

  get groups$() { return this._groups$.asObservable(); }
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

    return this.getGroups().pipe(map(res => {
      if (res.request.result === 'failed') {
        return {groups: [], total: 0};
      }

      let g = res.body.groups as Group[];

      // Set name field
      if (Array.isArray(g)) {
        // 1. sort
        let groups = sort(g, sortColumn, sortDirection);

        // 2. filter
        groups = groups.filter(group => matches(group, searchTerm, this.pipe));
        const total = groups.length;

        // 3. paginate
        groups = groups.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

        return {groups, total};
      } else {
        return {groups: [], total: 0};
      }
    }));
  }

  public refresh() {
    this._search$.next();
  }
}
