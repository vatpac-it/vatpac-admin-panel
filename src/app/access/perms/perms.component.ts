import {Component, OnInit, QueryList, ViewChildren} from '@angular/core';
import {Observable} from "rxjs";
import {Perm} from "../../models/User";
import {SortableHeaderDirective, SortEvent} from "../../sortable-header/sortable-header.directive";
import {PermsService} from "../../services/perms.service";
import {NavigationEnd, Router} from "@angular/router";

@Component({
  selector: 'app-perms',
  templateUrl: './perms.component.html',
  styleUrls: ['./perms.component.scss']
})
export class PermsComponent implements OnInit {

  perms$: Observable<Perm[]>;
  total$: Observable<number>;

  @ViewChildren(SortableHeaderDirective) headers: QueryList<SortableHeaderDirective>;

  constructor(public permsService: PermsService, public router: Router) {
    this.perms$ = permsService.perms$;
    this.total$ = permsService.total$;
  }

  ngOnInit() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd && e.url === '/access/perms') {
        this.permsService.refresh();
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

    this.permsService.sortColumn = column;
    this.permsService.sortDirection = direction;
  }

}
