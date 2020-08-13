import {Component, OnInit} from '@angular/core';
import {NavigationEnd, Router} from "@angular/router";
import {UserService} from "./services/user.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  crumbs = [];

  constructor(private router: Router, private userService: UserService) {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.crumbs = window.location.pathname.split('/').filter(r => r !== '');
      }
    });
  }

  getURI(i) {
    let out = [];
    for (let x = i; x >= 0; x--) {
      out.push(this.crumbs[x]);
    }

    return out.reverse();
  }
}
