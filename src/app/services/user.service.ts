import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpBackend, HttpClient, HttpHeaders} from '@angular/common/http';
import {User} from '../models/User';
import {CoreResponse} from "../models/CoreResponse";
import {environment} from "../../environments/environment";
import {Router} from "@angular/router";

const url = environment.url;

interface JWTToken {
  token: string;
  expiry: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private jwt_token: BehaviorSubject<JWTToken>;
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;

  constructor(private httpBackend: HttpBackend, private router: Router) {
    this.jwt_token = new BehaviorSubject<JWTToken>(null);
    this.currentUserSubject = new BehaviorSubject<User>(null);
    this.currentUser = this.currentUserSubject.asObservable();

    if (this.currentJWT === null) {
      this.getJWT();
    } else {
      this.getUser();
    }

    window.addEventListener('storage', this.syncLogout.bind(this));
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  public get currentJWT(): JWTToken {
    return this.jwt_token.value;
  }

  private redirectToLogin() {
    if (this.router.url !== '/login') this.router.navigate(['/login']);
  }

  private getUser() {
    new HttpClient(this.httpBackend).get<CoreResponse>(url + '/sso/user', {
      withCredentials: true,
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.currentJWT.token}`
      })
    })
      .subscribe((res) => {
        res = new CoreResponse(res);
        if (!res.success() || !res.body || !res.body.user) {
          this.redirectToLogin();
          return;
        }

        this.currentUserSubject.next(res.body.user);
      }, _ => {
        this.redirectToLogin();
      });
  }

  private getJWT() {
    // Can't use interceptor
    new HttpClient(this.httpBackend).get<CoreResponse>(url + '/sso/refresh_token',
      {withCredentials: true}).subscribe({
      next: res => {
        res = new CoreResponse(res);
        if (!res.success() || !res.body || !res.body.jwt_token || !res.body.jwt_token_expiry) {
          this.redirectToLogin();
          return;
        }

        this.jwt_token.next({token: res.body.jwt_token, expiry: res.body.jwt_token_expiry});

        this.getUser();

        // Start auto refresh countdown
        const time = res.body.jwt_token_expiry - 30000;
        const this$ = this;
        setTimeout(function () {
          console.log('Refreshing JWT');
          this$.getJWT();
        }, time >= 30000 ? time : 30000);
      },
      error: _ => {
        this.redirectToLogin();
      }
    });
  }

  public login() {
    window.location.href = url + '/sso?callback=' + encodeURIComponent(environment.base_url);
  }

  public logout() {
    this.jwt_token.next(null);

    return new HttpClient(this.httpBackend).get(`${url}/sso/logout`,
      {withCredentials: true}).subscribe({
      complete: () => {
        localStorage.setItem('logout', String(Date.now()));
        this.redirectToLogin()
      }
    });
  }

  private syncLogout(ev: KeyboardEvent) {
    if (ev.key === 'logout') {
      console.log('Logged out in storage');
      this.jwt_token.next(null);
      this.redirectToLogin();
    }
  }

  public loggedIn() {
    return this.currentUserValue !== null && this.currentJWT !== null;
  }

  /***************************************
   * Perms
   * ---
   * Check if user has specific perm
   ***************************************/

  public isStaff() {
    return this.loggedIn() &&
      ((this.currentUserValue.groups.primary && this.currentUserValue.groups.primary.staff) ||
        this.currentUserValue.groups.secondary.filter(group => group && group.staff === true).length > 0);
  }

  public check(sku) {
    return this.loggedIn() &&
      this.currentUserValue.perms.filter(perm => perm.level === 3 && perm.perm.sku === sku).length > 0;
  }

  public isStaffObserve(cb) {
    this.currentUser.subscribe(() => {
      let isAdmin = this.currentUserValue !== null &&
        ((this.currentUserValue.groups.primary && this.currentUserValue.groups.primary.staff) ||
          this.currentUserValue.groups.secondary.filter(group => group && group.staff === true).length > 0);
      cb(isAdmin);
    });
  }
}
