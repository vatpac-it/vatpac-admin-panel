import { Injectable } from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpXsrfTokenExtractor} from "@angular/common/http";
import {Observable} from "rxjs";
import {UserService} from "../services/user.service";

function getCookie(name) {
  const splitCookie = document.cookie.split(';');
  for (let i = 0; i < splitCookie.length; i++) {
    let val = splitCookie[i];
    const splitValue = val.split('=');
    if (splitValue[0] === name) {
      return splitValue[1];
    }
  }
  return '';
}

@Injectable()
export class httpInterceptor implements HttpInterceptor {

  constructor(private userService: UserService, private tokenExtractor: HttpXsrfTokenExtractor) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // const csrfCookie = getCookie('XSRF-TOKEN');
    // console.log(document.cookie);
    //
    // request = request.clone({
    //   setHeaders: {
    //     'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    //     'X-XSRF-COOKIE': csrfCookie
    //   },
    //   withCredentials: true
    //   // body: '_csrf=g5GOsMNqGoUan6nXMMWTvw0H'
    // });
    //
    // return newRequest.handle(request);

    let token = this.tokenExtractor.getToken() as string;
    req = req.clone({ withCredentials: true });
    if (token !== null && !req.headers.has('X-XSRF-TOKEN')) {
      req.headers.set('X-XSRF-TOKEN', token);
    }
    // console.log(req, document.cookie, this.tokenExtractor.getToken());
    return next.handle(req);
  }
}
