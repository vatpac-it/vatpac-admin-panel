import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AtcappComponent } from './atcapp/atcapp.component';
import { SlotsComponent } from './slots/slots.component';
import { UsersComponent } from './users/users.component';

const routes: Routes = [
  { path: '', component: HomeComponent},
  { path: 'atcapp', component: AtcappComponent},
  { path: 'slots', component: SlotsComponent },
  { path: 'users', component: UsersComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
