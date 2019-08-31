import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import {EventComponent} from "./events/event/event.component";
import {EventsComponent} from "./events/events.component";
import {LoginComponent} from "./login/login.component";
import {AuthGuard} from "./guards/auth.guard";
import {CanDeactivateGuard} from "./guards/can-deactivate-guard";
import {ClientsComponent} from "./clients/clients.component";
import {ClientComponent} from "./clients/client/client.component";
import {AccessComponent} from "./access/access.component";
import {DataComponent} from "./data/data.component";

const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'events', canActivate: [AuthGuard], children: [
      { path: '', component: EventsComponent, canActivate: [AuthGuard] },
      { path: 'event', canActivate: [AuthGuard], canDeactivate: [CanDeactivateGuard], children: [
          { path: '', redirectTo: 'create', pathMatch: 'full' },
          { path: 'edit/:sku', component: EventComponent, canActivate: [AuthGuard], loadChildren: './events/event/event.module#EventModule' },
          { path: 'create', component: EventComponent, canActivate: [AuthGuard], loadChildren: './events/event/event.module#EventModule' }
        ] },
      { path: '**', redirectTo: '' }
    ] },
  { path: 'access', component: AccessComponent, canActivate: [AuthGuard], loadChildren: './access/access.module#AccessModule' },
  { path: 'clients', canActivate: [AuthGuard], children: [
      { path: '', component: ClientsComponent, canActivate: [AuthGuard]},
      { path: 'create', component: ClientComponent, canActivate: [AuthGuard]},
      { path: ':sku', component: ClientComponent, canActivate: [AuthGuard]}
    ] },
  { path: 'data', component: DataComponent, canActivate: [AuthGuard], loadChildren: './data/data.module#DataModule' },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
