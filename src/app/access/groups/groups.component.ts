import {Component, OnInit, QueryList, ViewChildren} from '@angular/core';
import {SortableHeaderDirective, SortEvent} from "../../sortable-header/sortable-header.directive";
import {Observable} from "rxjs";
import {take} from "rxjs/operators";
import {Group} from "../../models/User";
import {NavigationEnd, Router} from "@angular/router";
import {GroupsService} from "../../services/groups.service";
import {CoreResponse} from "../../models/CoreResponse";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CdkDragDrop, moveItemInArray} from "@angular/cdk/drag-drop";
import {AlertService} from "../../services/alert.service";

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit {

  groups$: Observable<Group[]>;
  total$: Observable<number>;

  loading$ = false;
  sort: {column: string, direction: string} = {column: '', direction: ''};

  @ViewChildren(SortableHeaderDirective) headers: QueryList<SortableHeaderDirective>;

  constructor(public groupsService: GroupsService, public router: Router) {
    this.groups$ = groupsService.groups$;
    this.total$ = groupsService.total$;
  }

  ngOnInit() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd && e.url === '/access/groups') {
        this.groupsService.refresh();
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

    this.groupsService.sortColumn = column;
    this.groupsService.sortDirection = direction;
    this.sort = {column: column, direction: direction};
  }

}
