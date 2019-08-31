import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {AuthGuard} from "../guards/auth.guard";
import {UsersComponent} from "./users/users.component";
import {GroupsComponent} from "./groups/groups.component";
import {GroupComponent} from "./groups/group/group.component";
import {PermComponent} from "./perms/perm/perm.component";
import {PermsComponent} from "./perms/perms.component";
import {UserComponent} from "./users/user/user.component";

const routes: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  { path: 'users', canActivate: [AuthGuard], children: [
      { path: '', component: UsersComponent, canActivate: [AuthGuard]},
      { path: ':id', component: UserComponent, canActivate: [AuthGuard]}
    ] },
  { path: 'groups', canActivate: [AuthGuard], children: [
      { path: '', component: GroupsComponent, canActivate: [AuthGuard] },
      { path: 'create', component: GroupComponent, canActivate: [AuthGuard] },
      { path: ':id', component: GroupComponent, canActivate: [AuthGuard] }
    ] },
  { path: 'perms', canActivate: [AuthGuard], children: [
      { path: '', component: PermsComponent, canActivate: [AuthGuard] },
      { path: 'create', component: PermComponent, canActivate: [AuthGuard] },
      { path: ':sku', component: PermComponent, canActivate: [AuthGuard] }
    ] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccessRoutingModule { }
