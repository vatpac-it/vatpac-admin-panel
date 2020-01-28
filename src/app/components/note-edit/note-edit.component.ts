import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {FormControl, Validators} from "@angular/forms";

@Component({
  selector: 'note-edit',
  templateUrl: './note-edit.component.html',
  styleUrls: ['./note-edit.component.scss']
})
export class NoteEditComponent implements OnInit {

  @Input() content: FormControl = new FormControl('', Validators.required);
  @Input() creator: string = 'You';
  @Input() editor: {user: string, date: Date};

  maxLength = 2000;

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit() {
  }

}
