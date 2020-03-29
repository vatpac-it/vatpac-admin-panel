import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {EditorModule} from '@tinymce/tinymce-angular';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {HTTP_INTERCEPTORS, HttpClientModule, HttpClientXsrfModule} from "@angular/common/http";
import {FaIconLibrary, FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {faCalendarAlt, faDownload, faHome, faTimes, faTrash} from '@fortawesome/free-solid-svg-icons';
import './helpers/date-prototypes';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {NavComponent} from './nav/nav.component';
import {FooterComponent} from './footer/footer.component';
import {HomeComponent} from './home/home.component';
import {SlotsComponent} from './slots/slots.component';
import {EventsComponent} from './events/events.component';
import {EventComponent} from './events/event/event.component';
import {FileUploadComponent} from './components/file-upload/file-upload.component';
import {DecimalPipe} from "@angular/common";
import {LoginComponent} from './login/login.component';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {CoreHttpInterceptor} from "./interceptors/http-interceptor.service";
import {CanDeactivateGuard} from "./guards/can-deactivate-guard";
import {AlertComponent} from './components/alert/alert.component';
import {AlertService} from "./services/alert.service";
import {AccessComponent} from './access/access.component';
import {SortableHeaderModule} from "./sortable-header/sortable-header.module";
import {NoteEditComponent} from './components/note-edit/note-edit.component';
import {ReserveATCComponent} from "./components/reserve-atc/reserve-atc.component";
import {AtcTimelineComponent} from "./components/reserve-atc/atc-timeline/atc-timeline.component";
import {AirportLineComponent} from "./components/reserve-atc/airport-line/airport-line.component";
import {WebsocketService} from "./services/websocket.service";
import {FilesService} from "./services/files.service";

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    FooterComponent,
    HomeComponent,
    SlotsComponent,
    EventsComponent,
    EventComponent,
    FileUploadComponent,
    LoginComponent,
    AlertComponent,
    AccessComponent,
    NoteEditComponent,
    ReserveATCComponent,
    AtcTimelineComponent,
    AirportLineComponent,
  ],
  entryComponents: [FileUploadComponent, NoteEditComponent, ReserveATCComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    SortableHeaderModule,
    ReactiveFormsModule,
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN'
    }),
    NgbModule,
    EditorModule,
    FontAwesomeModule,
    AppRoutingModule
  ],
  providers: [AlertService, WebsocketService, FilesService, DecimalPipe, {
    provide: HTTP_INTERCEPTORS,
    useClass: CoreHttpInterceptor,
    multi: true
  }, CanDeactivateGuard],
  exports: [
    ReserveATCComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faCalendarAlt, faTimes, faDownload, faTrash, faHome);
  }
}
