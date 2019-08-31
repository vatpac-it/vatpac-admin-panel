import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SortableHeaderDirective} from "./sortable-header.directive";

@NgModule({
  declarations: [
    SortableHeaderDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SortableHeaderDirective
  ]
})
export class SortableHeaderModule { }
