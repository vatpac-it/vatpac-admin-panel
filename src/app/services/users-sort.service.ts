import {Injectable, PipeTransform} from '@angular/core';
import {User} from "../models/User";
import {SortDirection} from "../sortable-header/sortable-header.directive";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {DecimalPipe} from "@angular/common";
import {debounceTime, delay, map, switchMap, tap} from "rxjs/operators";
import {CoreResponse} from "../models/CoreResponse";
import {UserAccessService} from "./user-access.service";

interface SearchResult {
  users: User[];
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

function sort(users: User[], column: string, direction: string): User[] {
  if (direction === '') {
    return users;
  } else {
    return [...users].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(user: User, term: string, pipe: PipeTransform) {
  term = term.toLowerCase();
  return user.cid.toLowerCase().includes(term)
    || user.name.toLowerCase().includes(term)
    || user.atc_rating.toLowerCase().includes(term)
    || (user.pilot_rating || '').toString().toLowerCase().includes(term)
    || user.groups.primary.name.toLowerCase().includes(term);
}

@Injectable({
  providedIn: 'root'
})
export class UsersSortService {

  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _users$ = new BehaviorSubject<User[]>([]);
  private _total$ = new BehaviorSubject<number>(0);

  private _state: State = {
    page: 1,
    pageSize: 5,
    searchTerm: '',
    sortColumn: '',
    sortDirection: ''
  };

  constructor(private userAccessService: UserAccessService, private pipe: DecimalPipe) {
    this._search$.pipe(
      tap(() => this._loading$.next(true)),
      debounceTime(200),
      switchMap(() => this._search()),
      delay(200),
      tap(() => this._loading$.next(false))
    ).subscribe(result => {
      this._users$.next(result.users);
      this._total$.next(result.total);
    });

    this._search$.next();
  }

  get users$() { return this._users$.asObservable(); }
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

    return this.userAccessService.getUsers().pipe(map(res => {
      res = new CoreResponse(res);
      if (!res.success()) {
        return {users: [], total: 0};
      }

      let us = res.body.users as User[];

      // Set name field
      if (Array.isArray(us)) {
        us = us.map(user => {
          user.name = user.first_name && user.last_name ? user.first_name + ' ' + user.last_name : user.first_name;
          user.group_name = user.groups.primary ? user.groups.primary.name : (user.groups.secondary.length > 0 ? user.groups.secondary[0].name : 'None');
          user.pilot_rating = (user.pilot_rating ? Array.isArray(user.pilot_rating) ? user.pilot_rating.join(', ') : (parseInt(user.pilot_rating.toString()) === 0 ? 'None' : user.pilot_rating.toString()) : 'None');

          return user;
        });

        // 1. sort
        let users = sort(us, sortColumn, sortDirection);

        // 2. filter
        users = users.filter(user => matches(user, searchTerm, this.pipe));
        const total = users.length;

        // 3. paginate
        users = users.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

        return {users, total};
      } else {
        return {users: [], total: 0};
      }
    }));
  }

  public refresh() {
    this._search$.next();
  }
}
