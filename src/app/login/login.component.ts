import { Component, OnInit } from '@angular/core';
import {UserService} from "../services/user.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loading$ = false;

  constructor(public userService: UserService, private router: Router) { }

  ngOnInit() {
    this.userService.isStaffObserve(res => {
      if (res) {
        this.router.navigate(['/']);
      }
    });
  }

  login() {
    this.loading$ = true;

    this.userService.login();
  }

}
