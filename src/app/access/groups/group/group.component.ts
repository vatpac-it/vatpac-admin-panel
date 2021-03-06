import { Component, OnInit } from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {GroupsService} from "../../../services/groups.service";
import {Group, Perm} from "../../../models/User";
import {AlertService} from "../../../services/alert.service";
import {CoreResponse} from "../../../models/CoreResponse";
import {PermsService} from "../../../services/perms.service";
import {map, take} from "rxjs/operators";
import {Observable} from "rxjs";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import * as deepmerge from "deepmerge";

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit {

  group = new FormGroup({
    name: new FormControl('', Validators.required),
    colour: new FormControl('', [Validators.pattern('^[a-zA-Z0-9]+'), Validators.maxLength(6)]),
    staff: new FormControl(false, Validators.required)
  });

  id: string;
  groupPerms: {perm: Perm, level: number}[];
  perms = new FormGroup({});

  inherit: Group[] = [];
  allGroups: Group[] = [];
  groups: Group[] = [];

  submitTxt = "Create Group";
  loading$ = false;
  canSubmit$ = true;
  deleteLoading$ = false;
  objectKeys = Object.keys;

  constructor(private route: ActivatedRoute, private router: Router, private alertService: AlertService, private groupsService: GroupsService, private permsService: PermsService, private _modalService: NgbModal) {
    permsService.getPerms().subscribe({
      next: (res => {
        res = new CoreResponse(res);
        if (res.success()) {
          for (let perm of res.body.perms) {
            const type = perm.sku.split('.')[0];
            if (!this.perms.contains(type)) this.perms.addControl(type, new FormArray([]));

            this.getPermArray(type).push(new FormGroup({
              id: new FormControl({value: perm._id, disabled: true}),
              sku: new FormControl({value: perm.sku, disabled: true}),
              description: new FormControl({value: perm.description, disabled: true}),
              level: new FormControl('0'),
            }));
          }
        } else {
          this.alertService.add('danger', 'Error getting perms');
          this.router.navigate(['/access/groups']);
        }
      }),
      error: _ => {
        this.alertService.add('danger', 'Error getting perms');
        this.router.navigate(['/access/groups']);
      }
    });

    this.id = this.route.snapshot.params['id'];
    if (this.id) {
      let valSet = false;
      groupsService.getGroup(this.id).subscribe(res => {
        res = new CoreResponse(res);
        if (res.success()) {
          this.group.controls['name'].setValue(res.body.group.name);
          this.group.controls['colour'].setValue(res.body.group.colour);
          this.group.controls['staff'].setValue(res.body.group.staff);

          groupsService.getGroups().subscribe(res2 => {
            res2 = new CoreResponse(res2);
            if (res2.success()) {
              this.allGroups = res2.body.groups;
              this.inherit = res.body.group.inherit.map(id => {
                let groups = res2.body.groups.filter(g => g._id === id);
                if (groups.length === 0) return null;
                return groups[0];
              }).filter(g => g !== null);
              this.groups = res2.body.groups.filter(g => g._id !== this.id && this.inherit.indexOf(g) === -1);
            } else {
              alertService.add('danger', 'Error Getting Selectable Groups');
              router.navigate(['/access/groups']);
            }
          }, _ => {
            alertService.add('danger', 'Error Getting Selectable Groups');
            router.navigate(['/access/groups']);
          });

          this.submitTxt = "Save Group";

          this.groupPerms = res.body.group.perms;

          for (let type of Object.keys(this.perms.controls)) {
            for (let perm of this.getPermArray(type).controls) {
              const aPerm = this.groupPerms.map(p => p.perm).indexOf((perm as FormGroup).get('id').value);
              perm.get('level').setValue((aPerm !== -1 ? this.groupPerms[aPerm].level : 0).toString());
            }
          }

          valSet = true;
        } else {
          alertService.add('danger', 'Error getting group');
          router.navigate(['/access/groups']);
        }

        setTimeout(function () {
          if (!valSet) {
            alertService.add('danger', 'Error getting group');
            router.navigate(['/access/groups']);
          }
        }, 3000);
      }, error => {
        alertService.add('danger', 'Error getting group');
        router.navigate(['/access/groups']);
      });
    } else {
      groupsService.getGroups().subscribe(res => {
        res = new CoreResponse(res);
        if (res.success()) {
          this.allGroups = res.body.groups;
          this.groups = res.body.groups.filter(g => g._id !== this.id);
        } else {
          alertService.add('danger', 'Error Getting Selectable Groups');
          router.navigate(['/access/groups']);
        }
      }, _ => {
        alertService.add('danger', 'Error Getting Selectable Groups');
        router.navigate(['/access/groups']);
      });
    }
  }

  ngOnInit() {
  }

  getPermArray(type) {
    return this.perms.get(type) as FormArray;
  }

  markAllAs(type, level) {
    this.getPermArray(type).controls.forEach(perm => {
      perm.get('level').setValue(level.toString());
    });
  }

  addInheritGroup(group: Group) {
    if (this.inherit.indexOf(group) === -1 && group._id !== this.id) {
      this.inherit.push(group);
      this.groups.splice(this.groups.indexOf(group), 1);
    }
  }

  removeInheritGroup(group: Group) {
    if (this.inherit.indexOf(group) !== -1) {
      if (this.groups.indexOf(group) === -1 && group._id !== this.id) {
        this.groups.push(group);
      }
      this.inherit.splice(this.inherit.indexOf(group), 1);
    }
  }

  inheritList(group: Group) {
    return group.inherit.map(id => {
      let groups = this.allGroups.filter(g => g._id === id);
      if (groups.length === 0) return null;
      return groups[0].name;
    }).filter(g => g !== null);
  }

  submitGroup() {
    this.loading$ = true;
    let name = this.group.controls['name'];
    let colour = this.group.controls['colour'];
    let staff = this.group.controls['staff'];
    let inherit = this.inherit.map(g => g._id);
    let perms: {perm: string, level: number}[] = [];

    if (!name.valid || !colour.valid || !staff.valid) return this.alertService.add('danger', 'One or more fields are invalid. Please correct them before trying again.');

    for (let type of Object.keys(this.perms.controls)) {
      for (let perm of this.getPermArray(type).controls) {
        let id = perm.get('id').value;
        let level = parseInt(perm.get('level').value);

        if (level !== 0 || (this.groupPerms && this.groupPerms.map(p => p.perm).indexOf(id) !== -1)) {
          perms.push({perm: id, level: level});
        }
      }
    }

    if (this.id) {
      this.groupsService.editGroup(this.id, name.value, colour.value === '' ? null : colour.value, staff.value, inherit, perms).subscribe(res => {
        res = new CoreResponse(res);
        if (res.success()) {
          this.submitTxt = 'Saved';

          this.canSubmit$ = false;
          let this$ = this;
          setTimeout(function () {
            this$.alertService.add('success', 'Saved Group Successfully.');
            this$.router.navigate(['/access/groups']);
          }, 1000);
        } else {
          this.alertService.add('danger', 'There was an error updating the group, please try again later. ' + res.request.message + '.');
        }
        this.loading$ = false;
      }, error => {
        this.loading$ = false;
        this.alertService.add('danger', 'There was an error updating the group, please try again later. ' + error.error.request.message + '.');
      });
    } else {
      this.groupsService.createGroup(name.value, colour.value === '' ? null : colour.value, staff.value, inherit, perms).subscribe(res => {
        res = new CoreResponse(res);
        if (res.success()) {
          this.submitTxt = 'Saved';

          this.canSubmit$ = false;
          let this$ = this;
          setTimeout(function () {
            this$.alertService.add('success', 'Saved Group Successfully.');
            this$.router.navigate(['/access/groups']);
          }, 1000);
        } else {
          this.alertService.add('danger', 'There was an error creating the group, please try again later. ' + res.request.message + '.');
        }
        this.loading$ = false;
      }, error => {
        this.loading$ = false;
        this.alertService.add('danger', 'There was an error creating the group, please try again later. ' + error.error.request.message + '.');
      });
    }
  }

  deleteGroup(content) {
    if (this.id) {
      this._modalService.open(content, {ariaLabelledBy: 'confirm-delete-modal'}).result.then((result) => {
        if (result === 'okClick') {
          this.deleteLoading$ = true;

          this.groupsService.deleteGroup(this.id).subscribe(res => {
            res = new CoreResponse(res);
            if (res.success()) {
              this.alertService.add('success', 'Deleted Group Successfully.');

              this.router.navigate(['/access/groups']);
            } else {
              this.alertService.add('danger', 'There was an error deleting the group, please try again later.');
            }
            this.deleteLoading$ = false;
          }, error => {
            this.alertService.add('danger', 'There was an error deleting the group, please try again later.');
            this.deleteLoading$ = false;
          });
        }
      });
    }
  }

}
