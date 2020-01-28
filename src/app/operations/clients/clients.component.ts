import {Component, OnInit, QueryList, ViewChildren} from '@angular/core';
import {Observable} from "rxjs";
import {SortableHeaderDirective, SortEvent} from "../../sortable-header/sortable-header.directive";
import {ClientService} from "../../services/client.service";
import {NavigationEnd, Router} from "@angular/router";
import {Client} from "../../models/Client";

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
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd && e.url.startsWith('/clients')) {
        this.clientService.refresh();
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

    this.clientService.sortColumn = column;
    this.clientService.sortDirection = direction;
  }

}
