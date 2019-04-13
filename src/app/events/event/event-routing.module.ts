import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {GeneralComponent} from "./general/general.component";
import {AtcappComponent} from "./atcapp/atcapp.component";
import {ApplicationsComponent} from "./applications/applications.component";
import {AuthGuard} from "../../guards/auth.guard";

const routes: Routes = [
  { path: '', redirectTo: 'general', pathMatch: 'full' },
  { path: 'general', component: GeneralComponent, canActivate: [AuthGuard] },
  { path: 'atcapps', component: AtcappComponent, canActivate: [AuthGuard] },
  { path: 'applications', component: ApplicationsComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EventRoutingModule { }
