import {Injectable, PipeTransform} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {User} from '../models/User';
import {SortDirection} from "./sortable-header.directive";
import {debounceTime, delay, map, switchMap, tap} from "rxjs/operators";
import {DecimalPipe} from "@angular/common";
import {CoreResponse} from "../models/CoreResponse";

const url = 'https://core.vatpac.org';

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
  return user.cid.toLowerCase().includes(term)
    || user.name.toLowerCase().includes(term)
    || user.atc_rating.toLowerCase().includes(term)
    || user.pilot_rating.toString().toLowerCase().includes(term)
    || user.groups.primary.name.toLowerCase().includes(term);
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;

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

  constructor(private http: HttpClient, private pipe: DecimalPipe) {
    this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('current_user')));
    this.currentUser = this.currentUserSubject.asObservable();


    this.http.get<CoreResponse>(url + '/sso/user')
      .subscribe((res) => {
        if (!res || res.request.result === 'failed') {
          this.logoutData(null);
          return;
        }

        if (res.request.result === 'success' && res.body.user) {
          localStorage.setItem('current_user', JSON.stringify(res.body.user));
          this.currentUserSubject.next(res.body.user);
        }
      });

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

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  public getUsers(): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(url + '/users');
  }

  public login() {
    const callback = 'https://admin.vatpac.org/';
    window.location.href = url + '/sso?callback=' + encodeURIComponent(callback);
  }

  public logout() {
    this.logoutData((res) => {
      console.log('Logged out successfully');
      window.location.reload();
    });
  }

  public logoutData(cb) {
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);

    return this.http.get(`${url}/sso/logout`).subscribe(cb);
  }

  public loggedIn() {
    return this.currentUserValue !== null;
  }

  /***************************************
   * Perms
   * ---
   * Check if user has specific perm
   ***************************************/

  public isStaff() {
    return this.currentUserValue !== null && (this.currentUserValue.groups.primary.id > 10 || this.currentUserValue.groups.secondary.filter(group => group.id > 10).length > 0);
  }

  public hasUserAccess() {
    return this.currentUserValue !== null && this.currentUserValue.perms.map(perm => perm.id).indexOf(8734) !== -1;
  }

  public hasEventAccess() {
    return this.currentUserValue !== null && this.currentUserValue.perms.map(perm => perm.id).indexOf(7483) !== -1;
  }





  public isAdminObserve(cb) {
    this.currentUser.subscribe(user => {
      cb(user !== null && user.groups.primary.id > 10);
    });
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

    return this.getUsers().pipe(map(res => {
      if (res.request.result === 'failed') {
        return {users: [], total: 0};
      }

      let us = res.body.users as User[];

      // Set name field
      if (Array.isArray(us)) {
        us = us.filter(user => {
          user.name = user.first_name && user.last_name ? user.first_name + ' ' + user.last_name : user.first_name;
          user.group_name = user.groups.primary.name;
          user.pilot_rating = Array.isArray(user.pilot_rating) ? user.pilot_rating.join(', ') : (parseInt(user.pilot_rating.toString()) === 0 ? 'None' : user.pilot_rating.toString());

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
}
