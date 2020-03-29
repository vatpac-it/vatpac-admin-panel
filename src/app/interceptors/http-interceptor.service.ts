import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs";
import {UserService} from "../services/user.service";

@Injectable()
export class CoreHttpInterceptor implements HttpInterceptor {

  constructor(private userService: UserService) {
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
  }
}
