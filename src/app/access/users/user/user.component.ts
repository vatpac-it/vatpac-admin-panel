import { Component, OnInit } from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {AlertService} from "../../../services/alert.service";
import {CoreResponse} from "../../../models/CoreResponse";
import {UserService} from "../../../services/user.service";
import {Group} from "../../../models/User";
import {GroupsService} from "../../../services/groups.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {NoteEditComponent} from "../../../components/note-edit/note-edit.component";
import {animate, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'app-user',
  animations: [
    trigger(
      'inOutAnimation',
      [
        transition(
          ':enter',
          [
            style({ height: 0, opacity: 0 }),
            animate('1s ease-out',
              style({ height: 300, opacity: 1 }))
          ]
        ),
        transition(
          ':leave',
          [
            style({ height: 300, opacity: 1 }),
            animate('1s ease-in',
              style({ height: 0, opacity: 0 }))
          ]
        )
      ]
    )
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  user = new FormGroup({
    cid: new FormControl({value: '', disabled: true}, Validators.required),
    name: new FormControl({value: '', disabled: true}, Validators.required),
    email: new FormControl({value: '', disabled: true}, Validators.required),
    country: new FormControl({value: '', disabled: true}, Validators.required),
    region: new FormControl({value: '', disabled: true}, Validators.required),
    division: new FormControl({value: '', disabled: true}, Validators.required),
    atc_rating: new FormControl({value: '', disabled: true}, Validators.required),
    pilot_rating: new FormControl({value: '', disabled: true}, Validators.required),
    discord: new FormGroup({
      id: new FormControl({value: '', disabled: true}, Validators.required),
      username: new FormControl({value: '', disabled: true}, Validators.required),
      avatar: new FormControl({value: '', disabled: true}, Validators.required),
      discriminator: new FormControl({value: '', disabled: true}, Validators.required),
      ban: new FormGroup({
        kind: new FormControl({value: '', disabled: true}, Validators.required),
        reason: new FormControl({value: '', disabled: true}, Validators.required),
        expires: new FormControl({value: new Date(), disabled: true}, Validators.required)
      }),
    }),
    perms: new FormArray([]),
    staff_notes: new FormArray([])
  });

  id: string;

  groups: Group[] = [];
  primary: Group;
  secondary: Group[] = [];

  loadingNotes = [];

  loading$ = false;
  canSubmit$ = true;
  submitTxt = "Save User";

  constructor(private route: ActivatedRoute, private router: Router, private alertService: AlertService, public userService: UserService, private groupsService: GroupsService, private modalService: NgbModal) {
    this.id = this.route.snapshot.params['id'];
    if (!this.id) {
      alertService.add('danger', 'Error: No User Provided');
      router.navigate(['/access/users']);
      return;
    }

    let valSet = false;
    userService.getUser(this.id).subscribe(res => {
      res = new CoreResponse(res);
      if (res.success()) {
        this.user.controls['cid'].setValue(res.body.user.cid);
        this.user.controls['name'].setValue(res.body.user.first_name + ' ' + res.body.user.last_name);
        this.user.controls['email'].setValue(res.body.user.email || '******************');
        this.user.controls['country'].setValue(res.body.user.country || '***');
        this.user.controls['region'].setValue(res.body.user.region);
        this.user.controls['division'].setValue(res.body.user.division);
        this.user.controls['atc_rating'].setValue(res.body.user.atc_rating);
        this.user.controls['pilot_rating'].setValue(res.body.user.pilot_rating);

        if (res.body.user.discord) {
          this.discord.controls.username.setValue(res.body.user.discord.username);
          this.discord.controls.id.setValue(res.body.user.discord.id);
          this.discord.controls.discriminator.setValue(res.body.user.discord.discriminator);
          this.discord.controls.avatar.setValue(res.body.user.discord.avatar);

          if (res.body.user.discord.ban) {
            this.ban.controls.kind.setValue(res.body.user.discord.ban.kind);
            this.ban.controls.reason.setValue(res.body.user.discord.ban.reason);
            this.ban.controls.expires.setValue(new Date(res.body.user.discord.ban.expires));
          }
        }

        this.primary = res.body.user.groups.primary;
        this.secondary = res.body.user.groups.secondary;

        if (userService.check('users.perms')) {
          groupsService.getGroups().subscribe(res2 => {
            res2 = new CoreResponse(res2);
            if (res2.success()) {
              if (!this.primary) {
                let member = res2.body.groups.filter(g => g.name.toLowerCase() === 'member');
                if (member.length > 0) {
                  this.primary = member[0];
                }
              }
              let ids = this.secondary.map(g => g._id);
              this.groups = res2.body.groups.filter(g => ids.indexOf(g._id) === -1 && (this.primary ? g._id !== this.primary._id : false));
            } else {
              alertService.add('danger', 'Error Getting Selectable Groups');
              router.navigate(['/access/users']);
            }
          }, error => {
            alertService.add('danger', 'Error Getting Selectable Groups');
            router.navigate(['/access/users']);
          });
        }

        if (res.body.user.staff_notes) {
          for (let note of res.body.user.staff_notes) {
            console.log(note);
            this.staff_notes.push(new FormGroup({
              _id: new FormControl(note._id, Validators.required),
              content: new FormControl({value: note.content, disabled: true}, [Validators.required, Validators.maxLength(2000)]),
              creator: new FormControl(`${note.creator.first_name} ${note.creator.last_name} - ${note.creator.cid}`, Validators.required),
              editor: new FormGroup({
                user: new FormControl(note.editor.user ? `${note.editor.user.first_name} ${note.editor.user.last_name} - ${note.editor.user.cid}` : ''),
                date: new FormControl(note.editor.date)
              })
            }));
          }
        }

        valSet = true;
      } else {
        alertService.add('danger', 'Error getting user');
        router.navigate(['/access/users']);
      }

      setTimeout(function () {
        if (!valSet) {
          alertService.add('danger', 'Error getting user');
          router.navigate(['/access/users']);
        }
      }, 3000);
    }, err => {
      alertService.add('danger', 'Error getting user');
      router.navigate(['/access/users']);
    });
  }

  ngOnInit() {
  }

  get timezone() { return Intl.DateTimeFormat().resolvedOptions().timeZone }

  get discord() { return this.user.controls.discord as FormGroup }

  get ban() { return this.discord.controls.ban as FormGroup }

  get expires() { return this.ban.controls.expires.value as Date }

  get staff_notes() { return this.user.controls.staff_notes as FormArray }

  asFormGroup(group) { return group as FormGroup }

  updateUser() {
    this.loading$ = true;

    this.userService.updateUser(this.id, this.primary, this.secondary).subscribe(res => {
      res = new CoreResponse(res);
      if (res.success()) {
        this.submitTxt = 'Saved';

        this.canSubmit$ = false;
        let this$ = this;
        setTimeout(function () {
          this$.alertService.add('success', 'Saved User Successfully.');
          this$.router.navigate(['/access/users']);
        }, 1000);
      } else {
        this.alertService.add('danger', 'There was an error saving the user, please try again later. ' + res.request.message + '.');
      }
      this.loading$ = false;
    }, error => {
      this.alertService.add('danger', 'There was an error saving the user, please try again later. ' + error.error.request.message + '.');
    });
  }

  addGroup(group: Group) {
    if (this.secondary.indexOf(group) === -1 && group._id !== this.primary._id) {
      this.secondary.push(group);
      this.groups.splice(this.groups.indexOf(group), 1);
    }
  }

  removeGroup(group: Group) {
    if (this.secondary.indexOf(group) !== -1) {
      if (this.groups.indexOf(group) === -1 && group._id !== this.primary._id) {
        this.groups.push(group);
      }
      this.secondary.splice(this.secondary.indexOf(group), 1);
    }
  }

  newNote() {
    const modalRef = this.modalService.open(NoteEditComponent, { size: 'lg' });
    modalRef.result.then(response => {
      if (response === 'cross-click') return;

      this.userService.createNote(this.id, response.content.value).subscribe(res => {
        res = new CoreResponse(res);
        if (!res.success()) return this.alertService.add('danger', 'There was an error creating the note');

        this.staff_notes.push(new FormGroup({
          id: new FormControl(res.body.note._id, Validators.required),
          content: new FormControl(response.content.value, [Validators.required, Validators.maxLength(2000)]),
          creator: new FormControl('You', Validators.required),
          editor: new FormGroup({
            user: new FormControl(''),
            date: new FormControl(new Date())
          })
        }));
        this.alertService.add('success', 'Note Created Successfully');
      }, error1 => {
        this.alertService.add('danger', 'There was an error creating the note');
      });
    });
  }

  editNote(i) {
    const modalRef = this.modalService.open(NoteEditComponent, { size: 'lg' });
    const group = this.staff_notes.controls[i] as FormGroup;

    modalRef.componentInstance.content.setValue(group.controls.content.value);
    modalRef.componentInstance.creator = group.controls.creator.value;
    modalRef.componentInstance.editor = {user: (group.controls.editor as FormGroup).controls.user.value, date: (group.controls.editor as FormGroup).controls.date.value};
    modalRef.result.then(response => {
      console.log(response);
      if (response === 'cross-click') return;

      this.loadingNotes.push(i);

      this.userService.editNote(this.id, group.controls._id.value, response.content.value).subscribe(res => {
        res = new CoreResponse(res);
        if (!res.success()) {
          this.alertService.add('danger', 'There was an error editing the note');
        } else {
          group.controls.content.setValue(response.content.value);
          (group.controls.editor as FormGroup).controls.user.setValue('You');
        }
        this.loadingNotes.splice(this.loadingNotes.indexOf(i), 1);
        this.alertService.add('success', 'Note Edited Successfully');
      }, error1 => {
        this.alertService.add('danger', 'There was an error editing the note');
        this.loadingNotes.splice(this.loadingNotes.indexOf(i), 1);
      });
    });
  }

  deleteNote(content, i) {
    if (this.staff_notes.length > 0) {
      this.modalService.open(content, {ariaLabelledBy: 'confirm-delete-modal'}).result.then((result) => {
        if (result === 'ok-click') {
          this.userService.deleteNote(this.id, (this.staff_notes.controls[i] as FormGroup).controls._id.value).subscribe(res => {
            res = new CoreResponse(res);
            if (!res.success()) return this.alertService.add('danger', 'There was an error deleting the note');

            this.alertService.add('success', 'Successfully deleted note');
            this.staff_notes.removeAt(i);
          }, error1 => {
            this.alertService.add('danger', 'There was an error deleting the note');
          })
        }
      });
    }
  }

}
