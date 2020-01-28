import {Injectable, isDevMode} from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
  HttpXsrfTokenExtractor
} from "@angular/common/http";
import {Observable} from "rxjs";
import {UserService} from "../services/user.service";
import {environment} from "../../environments/environment";

@Injectable()
export class httpInterceptor implements HttpInterceptor {

  constructor(private userService: UserService, private tokenExtractor: HttpXsrfTokenExtractor) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let token = this.tokenExtractor.getToken() as string;
    const options = {withCredentials: true};

    if (isDevMode()) {
      options['headers'] = new HttpHeaders({
        'Authorization': `Api-Key ${environment.apiKey}`
      });
    }

    req = req.clone(options);
    if (token !== null && !req.headers.has('X-XSRF-TOKEN')) {
      req.headers.set('X-XSRF-TOKEN', token);
    }

    return next.handle(req);
  }
}
