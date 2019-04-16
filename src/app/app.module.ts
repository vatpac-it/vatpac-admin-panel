import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { EditorModule } from '@tinymce/tinymce-angular';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import {HTTP_INTERCEPTORS, HttpClientModule, HttpClientXsrfModule} from "@angular/common/http";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {faCalendarAlt, fas, faTimes} from '@fortawesome/free-solid-svg-icons';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavComponent } from './nav/nav.component';
import { FooterComponent } from './footer/footer.component';
import { HomeComponent } from './home/home.component';
import { SlotsComponent } from './slots/slots.component';
import { UsersComponent } from './users/users.component';
import { EventsComponent } from './events/events.component';
import { EventComponent } from './events/event/event.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import {EventModule} from "./events/event/event.module";
import { SortableHeaderDirective } from './services/sortable-header.directive';
import {DecimalPipe} from "@angular/common";
import { LoginComponent } from './login/login.component';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {httpInterceptor} from "./interceptors/http-interceptor.service";
import {CanDeactivateGuard} from "./guards/can-deactivate-guard";

library.add(faCalendarAlt, faTimes);

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    FooterComponent,
    HomeComponent,
    SlotsComponent,
    UsersComponent,
    EventsComponent,
    EventComponent,
    FileUploadComponent,
    SortableHeaderDirective,
    LoginComponent
  ],
  entryComponents: [FileUploadComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
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
  providers: [DecimalPipe, { provide: HTTP_INTERCEPTORS, useClass: httpInterceptor, multi: true }, CanDeactivateGuard],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor () {}
}
