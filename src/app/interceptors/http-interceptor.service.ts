import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {BehaviorSubject, Observable} from "rxjs";
import {UserService} from "../services/user.service";
import {switchMap} from "rxjs/operators";

@Injectable()
export class CoreHttpInterceptor implements HttpInterceptor {

  // stream: BehaviorSubject<HttpEvent<any>>;

  constructor(private userService: UserService) {
    // this.stream = new BehaviorSubject<HttpEvent<any>>(null);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const options = {withCredentials: true};

    if (this.userService.currentJWT) {
      options['headers'] = new HttpHeaders({
        'Authorization': `Bearer ${this.userService.currentJWT.token}`
      });
    }

    req = req.clone(options);
    return next.handle(req);

    // this.userService.loading.subscribe(loading => {
    //   if (!loading) {
    //     this.stream.next(next.handle(req).pipe(switchMap(h => h)));
    //   }
    // });
    // return this.stream.asObservable();
  }
}
