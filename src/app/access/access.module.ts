import { NgModule } from '@angular/core';
import {CommonModule, DecimalPipe} from '@angular/common';

import { AccessRoutingModule } from './access-routing.module';
import {UsersComponent} from "./users/users.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {HttpClientModule} from "@angular/common/http";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";

import {library} from "@fortawesome/fontawesome-svg-core";
import {faCheck, faEdit, faPlus, faSort, faSortDown, faSortUp, faTimes} from "@fortawesome/free-solid-svg-icons";

import { GroupsComponent } from './groups/groups.component';
import { GroupComponent } from './groups/group/group.component';
import { PermsComponent } from './perms/perms.component';
import { PermComponent } from './perms/perm/perm.component';
import {SortableHeaderModule} from "../sortable-header/sortable-header.module";
import { UserComponent } from './users/user/user.component';
import { ApiKeysComponent } from './api-keys/api-keys.component';
import { ApiKeyComponent } from './api-keys/api-key/api-key.component';

library.add(faCheck, faTimes, faSort, faSortUp, faSortDown, faPlus, faEdit);

@NgModule({
  declarations: [
    UsersComponent,
    GroupsComponent,
    GroupComponent,
    PermsComponent,
    PermComponent,
    UserComponent,
    ApiKeysComponent,
    ApiKeyComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SortableHeaderModule,
    NgbModule,
    HttpClientModule,
    FontAwesomeModule,
    AccessRoutingModule
  ],
  providers: [DecimalPipe],
})
export class AccessModule { }
