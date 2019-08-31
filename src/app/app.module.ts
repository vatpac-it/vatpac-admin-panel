import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { EditorModule } from '@tinymce/tinymce-angular';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import {HTTP_INTERCEPTORS, HttpClientModule, HttpClientXsrfModule} from "@angular/common/http";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {faCalendarAlt, faDownload, faTimes, faTrash} from '@fortawesome/free-solid-svg-icons';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavComponent } from './nav/nav.component';
import { FooterComponent } from './footer/footer.component';
import { HomeComponent } from './home/home.component';
import { SlotsComponent } from './slots/slots.component';
import { EventsComponent } from './events/events.component';
import { EventComponent } from './events/event/event.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import {DecimalPipe} from "@angular/common";
import { LoginComponent } from './login/login.component';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {httpInterceptor} from "./interceptors/http-interceptor.service";
import {CanDeactivateGuard} from "./guards/can-deactivate-guard";
import { AlertComponent } from './components/alert/alert.component';
import {AlertService} from "./services/alert.service";
import { ClientsComponent } from './clients/clients.component';
import { ClientComponent } from './clients/client/client.component';
import { AccessComponent } from './access/access.component';
import {SortableHeaderModule} from "./sortable-header/sortable-header.module";
import { DataComponent } from './data/data.component';

library.add(faCalendarAlt, faTimes, faDownload, faTrash);

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
    ClientsComponent,
    ClientComponent,
    AccessComponent,
    DataComponent
  ],
  entryComponents: [FileUploadComponent],
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
  providers: [AlertService, DecimalPipe, { provide: HTTP_INTERCEPTORS, useClass: httpInterceptor, multi: true }, CanDeactivateGuard],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor () {}
}
