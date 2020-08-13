import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {AuthGuard} from "../guards/auth.guard";
import {ClientsComponent} from "./clients/clients.component";
import {ClientComponent} from "./clients/client/client.component";
import {NotamsComponent} from "./notams/notams.component";
import {NotamComponent} from "./notams/notam/notam.component";
import {DataComponent} from "./data/data.component";


const routes: Routes = [
  { path: 'clients', canActivate: [AuthGuard], children: [
      { path: '', component: ClientsComponent, canActivate: [AuthGuard]},
      { path: 'create', component: ClientComponent, canActivate: [AuthGuard]},
      { path: ':id', component: ClientComponent, canActivate: [AuthGuard]}
    ] },
  { path: 'notams', canActivate: [AuthGuard], children: [
      { path: '', component: NotamsComponent, canActivate: [AuthGuard] },
      { path: 'create', component: NotamComponent, canActivate: [AuthGuard] },
      { path: ':id', component: NotamComponent, canActivate: [AuthGuard] }
    ] },
  { path: 'data', component: DataComponent, canActivate: [AuthGuard], loadChildren: './data/data.module#DataModule' },
  { path: '**', redirectTo: 'data' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OperationsRoutingModule { }
