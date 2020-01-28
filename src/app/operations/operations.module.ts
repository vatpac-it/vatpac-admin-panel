import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OperationsRoutingModule } from './operations-routing.module';
import {ClientsComponent} from "./clients/clients.component";
import {ClientComponent} from "./clients/client/client.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {SortableHeaderModule} from "../sortable-header/sortable-header.module";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import { NotamsComponent } from './notams/notams.component';
import { NotamComponent } from './notams/notam/notam.component';
import {OwlDateTimeModule, OwlNativeDateTimeModule} from "ng-pick-datetime";
import {library} from "@fortawesome/fontawesome-svg-core";
import {faCalendar, faKey} from "@fortawesome/free-solid-svg-icons";

import { OWL_DATE_TIME_LOCALE } from 'ng-pick-datetime';
import {DataComponent} from "./data/data.component";

library.add(faCalendar, faKey);

@NgModule({
  declarations: [
    ClientsComponent,
    ClientComponent,
    NotamsComponent,
    NotamComponent,
    DataComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SortableHeaderModule,
    NgbModule,
    FontAwesomeModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    OperationsRoutingModule
  ],
  providers: [
    {provide: OWL_DATE_TIME_LOCALE, useValue: 'en-AU'}
  ]
})
export class OperationsModule { }
