import {Component, OnInit, QueryList, ViewChildren} from '@angular/core';
import {Observable} from "rxjs";
import {SortableHeaderDirective, SortEvent} from "../../../sortable-header/sortable-header.directive";
import {NavigationEnd, Router} from "@angular/router";
import {AirportsService} from "../../../services/airports.service";
import {Airport} from "../../../models/Airport";

@Component({
  selector: 'app-airports',
  templateUrl: './airports.component.html',
  styleUrls: ['./airports.component.scss']
})
export class AirportsComponent implements OnInit {

  airports$: Observable<Airport[]>;
  total$: Observable<number>;

  loading$ = false;
  sort: {column: string, direction: string} = {column: '', direction: ''};

  @ViewChildren(SortableHeaderDirective) headers: QueryList<SortableHeaderDirective>;

  constructor(public airportsService: AirportsService, public router: Router) {
    this.airports$ = airportsService.airports$;
    this.total$ = airportsService.total$;
  }

  ngOnInit() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd && e.url === '/access/groups') {
        this.airportsService.refresh();
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

    this.airportsService.sortColumn = column;
    this.airportsService.sortDirection = direction;
  }
}
