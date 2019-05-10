import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { UsersComponent } from './users/users.component';
import {EventComponent} from "./events/event/event.component";
import {EventsComponent} from "./events/events.component";
import {LoginComponent} from "./login/login.component";
import {AuthGuard} from "./guards/auth.guard";
import {CanDeactivateGuard} from "./guards/can-deactivate-guard";
import {ClientsComponent} from "./clients/clients.component";

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
  { path: 'users', canActivate: [AuthGuard], component: UsersComponent },
  { path: 'clients', canActivate: [AuthGuard], component: ClientsComponent },
  { path: 'login', component: LoginComponent },
  // { path: 'users', component: UsersComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
