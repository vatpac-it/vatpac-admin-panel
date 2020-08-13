import { NgModule } from '@angular/core';
import {CommonModule, DecimalPipe} from '@angular/common';

import {faCheck, faSort, faSortDown, faSortUp, faTimes} from "@fortawesome/free-solid-svg-icons";

import { DataRoutingModule } from './data-routing.module';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {SortableHeaderModule} from "../../sortable-header/sortable-header.module";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {HttpClientModule} from "@angular/common/http";
import {FaIconLibrary, FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {DragDropModule} from "@angular/cdk/drag-drop";
import { AirportsComponent } from './airports/airports.component';
import { AirportComponent } from './airports/airport/airport.component';

@NgModule({
  declarations: [AirportsComponent, AirportComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SortableHeaderModule,
    NgbModule,
    HttpClientModule,
    FontAwesomeModule,
    DragDropModule,
    DataRoutingModule
  ],
  providers: [DecimalPipe]
})
export class DataModule {

  constructor(library: FaIconLibrary) {
    library.addIcons(faCheck, faTimes, faSort, faSortUp, faSortDown)
  }
}
