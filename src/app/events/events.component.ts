import {Component, OnInit, QueryList, ViewChildren} from '@angular/core';
import {Observable} from "rxjs";
import {SortableHeaderDirective, SortEvent} from "../services/sortable-header.directive";
import {EventsService} from "../services/events.service";
import {Event} from "../models/Event";
import {DecimalPipe} from "@angular/common";
import {Router} from "@angular/router";
import {AlertService} from "../services/alert.service";

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
  providers: [EventsService, DecimalPipe]
})
export class EventsComponent implements OnInit {

  events$: Observable<Event[]>;
  total$: Observable<number>;

  @ViewChildren(SortableHeaderDirective) headers: QueryList<SortableHeaderDirective>;

  constructor(public eventsService: EventsService, public router: Router, private alertService: AlertService) {
    this.events$ = eventsService.events$;
    this.total$ = eventsService.total$;
  }

  ngOnInit() {
  }

  onSort({column, direction}: SortEvent) {
    // resetting other headers
    this.headers.forEach(header => {
      if (header.sortable !== column) {
        header.direction = '';
      }
    });

    this.eventsService.sortColumn = column;
    this.eventsService.sortDirection = direction;
  }

}
