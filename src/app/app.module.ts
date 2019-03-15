import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { EditorModule } from '@tinymce/tinymce-angular';
import { DataTablesModule } from "angular-datatables";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavComponent } from './nav/nav.component';
import { FooterComponent } from './footer/footer.component';
import { HomeComponent } from './home/home.component';
import { AtcappComponent } from './atcapp/atcapp.component';
import { SlotsComponent } from './slots/slots.component';
import { UsersComponent } from './users/users.component';

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    FooterComponent,
    HomeComponent,
    AtcappComponent,
    SlotsComponent,
    UsersComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    EditorModule,
    DataTablesModule,
    FontAwesomeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { 
  constructor () {
    library.add(fas);
  }
}
