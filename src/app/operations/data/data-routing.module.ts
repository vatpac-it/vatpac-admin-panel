import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {AuthGuard} from "../../guards/auth.guard";
import {AirportsComponent} from "./airports/airports.component";
import {AirportComponent} from "./airports/airport/airport.component";


const routes: Routes = [
  { path: '', redirectTo: 'airports', pathMatch: 'full' },
  { path: 'airports', canActivate: [AuthGuard], children: [
      { path: '', component: AirportsComponent, canActivate: [AuthGuard]},
      { path: ':id', component: AirportComponent, canActivate: [AuthGuard]}
    ] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DataRoutingModule { }
