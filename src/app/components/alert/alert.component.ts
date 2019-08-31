import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AlertService} from "../../services/alert.service";

@Component({
  selector: 'app-alert',
  template: '<div #alertEl><ngb-toast *ngFor="let alerts of (alertService.alerts | async); let i = index" [class]="\'bg-\' + alerts.type" [autohide]="!alerts.permanent || true" [delay]="alerts.permanent ? 500000 : alerts.delay || 5000" (hide)="alertService.remove(i)">\n' +
    '  <span class="text-white">{{ alerts.message }}</span>\n' +
    '</ngb-toast></div>',
  host: {'[class.ngb-toasts]': 'true'}
})
export class AlertComponent implements OnInit {
  @ViewChild('alertEl', {static: true}) alertEl: ElementRef;

  constructor(public alertService: AlertService) {
  }

  ngOnInit() {
  }

}
