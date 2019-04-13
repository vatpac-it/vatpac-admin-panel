import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {User} from '../models/User';

const url = 'https://core.vatpac.org';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('current_user')));
    this.currentUser = this.currentUserSubject.asObservable();

    this.http.get<User>(url + '/sso/user', { withCredentials: true })
      .subscribe((res) => {
        if (!res || res['request']['result'] === 'failed') {
          this.logoutData(null);
          return;
        }

        if (res['request']['result'] === 'success' && res['body']['user']) {
          localStorage.setItem('current_user', JSON.stringify(res['body']['user']));
          this.currentUserSubject.next(res['body']['user']);
        }
      });
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
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

  public isAdmin() {
    return this.currentUserValue !== null && this.currentUserValue.group_lvl > 10;
  }

  public isAdminObserve(cb) {
    this.currentUser.subscribe(user => {
      cb(user !== null && user.group_lvl > 10);
    });
  }
}
