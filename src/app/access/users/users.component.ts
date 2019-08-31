import {Component, OnInit, QueryList, ViewChildren} from '@angular/core';
import {Observable} from "rxjs";
import {SortableHeaderDirective, SortEvent} from "../../sortable-header/sortable-header.directive";
import {NavigationEnd, Router} from "@angular/router";
import {User} from "../../models/User";
import {UserService} from "../../services/user.service";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  users$: Observable<User[]>;
  total$: Observable<number>;

  loading$ = false;
  sort: {column: string, direction: string} = {column: '', direction: ''};

  @ViewChildren(SortableHeaderDirective) headers: QueryList<SortableHeaderDirective>;

  constructor(public usersService: UserService, public router: Router) {
    this.users$ = usersService.users$;
    this.total$ = usersService.total$;
  }

  ngOnInit() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd && e.url === '/access/groups') {
        this.usersService.refresh();
      }
    });
  }

  onSort({column, direction}: SortEvent) {
    // resetting other headers
    this.headers.forEach(header => {
      if (header.sortable !== column) {
        header.direction = '';
      }
    });

    this.usersService.sortColumn = column;
    this.usersService.sortDirection = direction;
  }

}
