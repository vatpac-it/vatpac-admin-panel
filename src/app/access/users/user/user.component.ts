import { Component, OnInit } from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {AlertService} from "../../../services/alert.service";
import {PermsService} from "../../../services/perms.service";
import {CoreResponse} from "../../../models/CoreResponse";
import {UserService} from "../../../services/user.service";
import {Group} from "../../../models/User";
import {GroupsService} from "../../../services/groups.service";

@Component({
  selector: 'app-user',
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
    perms: new FormArray([])
  });

  id: string;

  groups: Group[] = [];
  primary: Group;
  secondary: Group[] = [];

  loading$ = false;
  canSubmit$ = true;
  submitTxt = "Save User";

  constructor(private route: ActivatedRoute, private router: Router, private alertService: AlertService, private userService: UserService, private groupsService: GroupsService, private permsService: PermsService) {
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
        this.user.controls['email'].setValue(res.body.user.email);
        this.user.controls['country'].setValue(res.body.user.country);
        this.user.controls['region'].setValue(res.body.user.region);
        this.user.controls['division'].setValue(res.body.user.division);
        this.user.controls['atc_rating'].setValue(res.body.user.atc_rating);
        this.user.controls['pilot_rating'].setValue(res.body.user.pilot_rating);

        this.primary = res.body.user.groups.primary;
        this.secondary = res.body.user.groups.secondary;

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
        });

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

}
