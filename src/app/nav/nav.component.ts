import {Component, HostListener, OnInit} from '@angular/core';
import {UserService} from "../services/user.service";
import {animate, state, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
  animations: [
    trigger('collapse', [
      state('open', style({
        opacity: '1'
      })),
      state('closed',   style({
        opacity: '0',
      })),
      transition('closed => open', animate('400ms ease-in')),
      transition('open => closed', animate('100ms ease-out'))
    ])
  ]
})
export class NavComponent implements OnInit {

  appTitle: string = 'VATPAC Admin';

  navToggled = false;
  _isNavbarCollapsedAnim = 'closed';

  constructor(public userService: UserService) { }

  ngOnInit() {
    this.onResize(window);
  }

  @HostListener('window:resize', ['$event.target'])
  onResize(event) {
    if(event.innerWidth > 767){
      this._isNavbarCollapsedAnim = 'open';
      this.navToggled = false;
    }1
  }

  toggleNavbar() {
    if(this.navToggled){
      this._isNavbarCollapsedAnim = 'closed';
      this.navToggled = false;
    } else {
      this._isNavbarCollapsedAnim = 'open';
      this.navToggled = true;
    }
  }
  get isNavbarCollapsedAnim() : string { return this._isNavbarCollapsedAnim; }

  loggedIn() {
    return this.userService.loggedIn();
  }

  login() {
    this.userService.login();
  }

  logout() {
    this.userService.logout();
  }

}
