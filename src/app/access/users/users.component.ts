import {Component, OnInit, QueryList, ViewChildren} from '@angular/core';
import {Observable} from "rxjs";
import {SortableHeaderDirective, SortEvent} from "../../sortable-header/sortable-header.directive";
import {NavigationEnd, Router} from "@angular/router";
import {User} from "../../models/User";
import {UsersSortService} from "../../services/users-sort.service";

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

  constructor(public usersSortService: UsersSortService, public router: Router) {
    this.users$ = usersSortService.users$;
    this.total$ = usersSortService.total$;
  }

  ngOnInit() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd && e.url === '/access/users') {
        this.usersSortService.refresh();
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

    this.usersSortService.sortColumn = column;
    this.usersSortService.sortDirection = direction;
  }

}
