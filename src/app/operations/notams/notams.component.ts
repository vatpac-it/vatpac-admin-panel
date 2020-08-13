import {Component, OnInit, QueryList, ViewChildren} from '@angular/core';
import {NotamsService} from "../../services/notams.service";
import {Observable} from "rxjs";
import {SortableHeaderDirective, SortEvent} from "../../sortable-header/sortable-header.directive";
import {NavigationEnd, Router} from "@angular/router";
import {NOTAM} from "../../models/NOTAM";

@Component({
  selector: 'app-notams',
  templateUrl: './notams.component.html',
  styleUrls: ['./notams.component.scss']
})
export class NotamsComponent implements OnInit {

  notams$: Observable<NOTAM[]>;
  total$: Observable<number>;

  @ViewChildren(SortableHeaderDirective) headers: QueryList<SortableHeaderDirective>;

  constructor(public notamsService: NotamsService, public router: Router) {
    this.notams$ = notamsService.notams$;
    this.total$ = notamsService.total$;
  }

  ngOnInit() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd && e.url.startsWith('/operations/notams')) {
        this.notamsService.refresh();
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

    this.notamsService.sortColumn = column;
    this.notamsService.sortDirection = direction;
  }

}
