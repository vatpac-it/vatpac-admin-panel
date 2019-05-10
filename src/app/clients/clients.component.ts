import {Component, OnInit, QueryList, ViewChildren} from '@angular/core';
import {Observable} from "rxjs";
import {SortableHeaderDirective, SortEvent} from "../services/sortable-header.directive";
import {Client} from "../models/Client";
import {ClientService} from "../services/client.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit {

  clients$: Observable<Client[]>;
  total$: Observable<number>;

  @ViewChildren(SortableHeaderDirective) headers: QueryList<SortableHeaderDirective>;

  constructor(public clientService: ClientService, public router: Router) {
    this.clients$ = clientService.clients$;
    this.total$ = clientService.total$;
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

    this.clientService.sortColumn = column;
    this.clientService.sortDirection = direction;
  }

}
