import {Component, OnInit, QueryList, ViewChildren} from '@angular/core';
import {Observable} from "rxjs";
import {SortableHeaderDirective, SortEvent} from "../../sortable-header/sortable-header.directive";
import {NavigationEnd, Router} from "@angular/router";
import {API} from "../../models/API";
import {ApiListService} from "../../services/api-list.service";

@Component({
  selector: 'app-api-keys',
  templateUrl: './api-keys.component.html',
  styleUrls: ['./api-keys.component.scss']
})
export class ApiKeysComponent implements OnInit {

  apiKeys$: Observable<API[]>;
  total$: Observable<number>;

  loading$ = false;
  sort: {column: string, direction: string} = {column: '', direction: ''};

  @ViewChildren(SortableHeaderDirective) headers: QueryList<SortableHeaderDirective>;

  constructor(public apiListService: ApiListService, public router: Router) {
    this.apiKeys$ = apiListService.apiKeys$;
    this.total$ = apiListService.total$;
  }

  ngOnInit() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd && e.url === '/access/apis') {
        this.apiListService.refresh();
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

    this.apiListService.sortColumn = column;
    this.apiListService.sortDirection = direction;
    this.sort = {column: column, direction: direction};
  }

}
