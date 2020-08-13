import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EventRoutingModule } from './event-routing.module';
import {GeneralComponent} from "./general/general.component";
import {AtcappComponent} from "./atcapp/atcapp.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {HttpClientModule} from "@angular/common/http";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";

import { library } from '@fortawesome/fontawesome-svg-core';
import {faCalendarAlt, faPlus, faTimes, faTrash} from '@fortawesome/free-solid-svg-icons';
import {EditorModule} from "@tinymce/tinymce-angular";
import { ApplicationsComponent } from './applications/applications.component';

library.add(faCalendarAlt, faTimes, faPlus, faTrash);


@NgModule({
  declarations: [
    GeneralComponent,
    AtcappComponent,
    ApplicationsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    HttpClientModule,
    EditorModule,
    FontAwesomeModule,
    EventRoutingModule
  ]
})
export class EventModule { }
