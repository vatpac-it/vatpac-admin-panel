import {Injectable, isDevMode} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Group, User} from '../models/User';
import {map} from "rxjs/operators";
import {CoreResponse} from "../models/CoreResponse";

const url = 'https://core.vatpac.org';

interface JWT_Token {
  token: string;
  expiry: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private jwt_token: BehaviorSubject<JWT_Token>;
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('current_user')));
    this.currentUser = this.currentUserSubject.asObservable();

    if (typeof this.jwt_token === 'undefined' || this.jwt_token === null) {
      this.http.get<CoreResponse>(url + '/sso/refresh_token').subscribe({
        next: res => {
          res = new CoreResponse(res);
          if (!res.success() || !res.body || !res.body.jwt_token || !res.body.jwt_token_expiry) {
            // window.location.href
            console.log('Go to Login');
            return;
          }

          this.jwt_token.next({token: res.body.jwt_token, expiry: res.body.jwt_token_expiry});
        },
        error: err => {
          console.log('Go to Login');
        }
      });
    }
    this.http.get<CoreResponse>(url + '/sso/user')
      .subscribe((res) => {
        res = new CoreResponse(res);
        if (!res.success() || !res.body || !res.body.user) {
          if (localStorage.getItem('current_user') !== null) {
            this.logout();
          }
          return;
        }

        let u = res.body.user;

        this.getPerms().subscribe(p => {
          u.perms = u.perms.concat(p);

          localStorage.setItem('current_user', JSON.stringify(u));
          this.currentUserSubject.next(u);
        });
      }, error1 => {
        if (localStorage.getItem('current_user') !== null) {
          this.logout();
        }
      });
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  public getUsers(): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(url + '/access/users');
  }

  public getUser(id: string): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(url + '/access/users/' + id);
  }

  public updateUser(id: string, primary: Group, secondary: Group[]): Observable<CoreResponse> {
    return this.http.patch<CoreResponse>(url + '/access/users/' + id, {primary: primary, secondary: secondary});
  }

  public createNote(id: string, content: string): Observable<CoreResponse> {
    return this.http.post<CoreResponse>(url + '/access/users/' + id + '/newnote', {note: {content: content}});
  }

  public editNote(id: string, note_id: string, content: string): Observable<CoreResponse> {
    return this.http.patch<CoreResponse>(url + '/access/users/' + id + '/editnote/' + note_id, {note: {content: content}});
  }

  public deleteNote(id: string, note_id: string): Observable<CoreResponse> {
    return this.http.delete<CoreResponse>(url + '/access/users/' + id + '/deletenote/' + note_id);
  }

  public getPerms() {
    return this.http.get<CoreResponse>(url + '/sso/user/perms')
      .pipe(map((res) => {
        res = new CoreResponse(res);
        if (!res.success()) {
          this.logout();
          return;
        }

        return res.body.perms;
      }));
  }

  public login() {
    const callback = isDevMode() ? 'localhost:4200' : 'https://admin.vatpac.org/';
    window.location.href = url + '/sso?callback=' + encodeURIComponent(callback);
  }

  public logout() {
    this.logoutData((err) => {
      console.log('Logged out successfully');
      window.location.reload();
    });
  }

  public logoutData(cb) {
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);

    return this.http.get(`${url}/sso/logout`).subscribe({
      next: cb,
      error: cb
    });
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
    return this.currentUserValue !== null &&
      ((this.currentUserValue.groups.primary && this.currentUserValue.groups.primary.staff) ||
        this.currentUserValue.groups.secondary.filter(group => group && group.staff === true ).length > 0);
  }

  public check(sku) {
    return this.currentUserValue !== null && this.currentUserValue.perms.filter(perm => perm.level === 3 && perm.perm.sku === sku).length > 0;
  }

  public isStaffObserve(cb) {
    this.currentUser.subscribe(user => {
      let isAdmin = this.currentUserValue !== null &&
        ((this.currentUserValue.groups.primary && this.currentUserValue.groups.primary.staff) ||
          this.currentUserValue.groups.secondary.filter(group => group && group.staff === true ).length > 0);
      cb(isAdmin);
    });
  }
}
