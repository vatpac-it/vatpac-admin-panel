import { Component, OnInit } from '@angular/core';
import {FormArray, FormControl, FormGroup, ValidationErrors, Validators} from "@angular/forms";
import {AirportsService} from "../../../services/airports.service";
import {ActivatedRoute, Router} from "@angular/router";
import {AlertService} from "../../../services/alert.service";
import {Subscription} from "rxjs";
import {CoreResponse} from "../../../models/CoreResponse";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-airport',
  templateUrl: './airport.component.html',
  styleUrls: ['./airport.component.scss']
})
export class AirportComponent implements OnInit {

  airport = new FormGroup({
    icao: new FormControl({value: '', disabled: true}, Validators.required),
    apName: new FormControl('', Validators.required),
    city: new FormControl('', Validators.required),
    country: new FormControl('', Validators.required),
    fir: new FormControl('', Validators.required),
    lat: new FormControl('', Validators.required),
    lon: new FormControl('', Validators.required),
    apPax: new FormControl('', Validators.required),
    apNo: new FormControl('', Validators.required),
    ctfPax: new FormControl('', Validators.required),
    ctfTeam: new FormControl('', Validators.required),
    ctfProtect: new FormControl(false),
    ratingMin: new FormControl('', Validators.required),
    ratingMax: new FormControl('', Validators.required),
    apPaxBL: new FormControl('', Validators.required),
    sdRatio: new FormControl('', Validators.required),
    sdAct: new FormControl('', Validators.required),
    stations: new FormArray([])
  });

  id: string;

  airportSub: Subscription;

  loading$ = false;
  canSubmit$ = true;
  submitTxt = "Save Airport";

  constructor(private airportService: AirportsService, private alertService: AlertService, private route: ActivatedRoute, private router: Router, private _modalService: NgbModal) {
    this.id = route.snapshot.params.id;

    if (!this.id) {
      alertService.add('danger', 'Error: No Airport Provided');
      router.navigate(['/data/positions']);
      return;
    }

    this.airportSub = airportService.getAirport(this.id).subscribe(res => {
      res = new CoreResponse(res);

      if (!res.success()) {
        alertService.add('danger', 'Error: No Airport Provided');
        router.navigate(['/data/positions']);
        return;
      }

      this.airport.controls.icao.setValue(res.body.airport.icao);
      this.airport.controls.apName.setValue(res.body.airport.apName);
      this.airport.controls.city.setValue(res.body.airport.city);
      this.airport.controls.country.setValue(res.body.airport.country);
      this.airport.controls.fir.setValue(res.body.airport.fir);
      this.airport.controls.lat.setValue(res.body.airport.lat);
      this.airport.controls.lon.setValue(res.body.airport.lon);
      this.airport.controls.apPax.setValue(res.body.airport.apPax);
      this.airport.controls.apNo.setValue(res.body.airport.apNo);
      this.airport.controls.ctfPax.setValue(res.body.airport.ctfPax);
      this.airport.controls.ctfTeam.setValue(res.body.airport.ctfTeam);
      this.airport.controls.ctfProtect.setValue(res.body.airport.ctfProtect);
      this.airport.controls.ratingMin.setValue(res.body.airport.ratingMin);
      this.airport.controls.ratingMax.setValue(res.body.airport.ratingMax);
      this.airport.controls.apPaxBL.setValue(res.body.airport.apPaxBL);
      this.airport.controls.sdRatio.setValue(res.body.airport.sdRatio);
      this.airport.controls.sdAct.setValue(res.body.airport.sdAct);

      for (let section of res.body.airport.stations) {
        this.stations.push(
          new FormGroup({
            station: new FormControl(section.station, [Validators.required, Validators.maxLength(10)]),
            available: new FormControl(section.available, Validators.required)
          })
        );
      }

    }, error1 => {
      alertService.add('danger', 'Error: No Airport Provided');
      router.navigate(['/data/positions']);
    });
  }

  ngOnInit() {
  }

  get stations() { return this.airport.controls.stations as FormArray }

  addStation() {
    this.stations.push(
      new FormGroup({
        station: new FormControl('', [Validators.required, Validators.maxLength(10)]),
        available: new FormControl(true, Validators.required)
      })
    );
  }

  removeStation(i) {
    this.stations.removeAt(i);
  }

  confirmClear(content) {
    if (this.stations.length > 0) {
      this._modalService.open(content, {ariaLabelledBy: 'confirm-delete-modal'}).result.then((result) => {
        if (result === 'okClick') {
          this.stations.clear();
        }
      });
    }
  }

  submitAirport() {
    if (!this.id || !this.airport.valid) {
      this.alertService.add('danger', 'Error: Can\'t update Airport');
      this.router.navigate(['/data/positions']);
      return;
    }

    this.loading$ = true;

    this.airportService.updateAirport(this.id, this.airport.getRawValue()).subscribe(res => {
      res = new CoreResponse(res);
      this.loading$ = false;
      if (!res.success()) {
        this.alertService.add('danger', 'There was an error updating the airport, please try again later.');
      }

      this.submitTxt = 'Saved';
      this.alertService.add('success', 'Saved Permission Successfully.');

      this.canSubmit$ = false;
      let this$ = this;
      setTimeout(function () {
        this$.router.navigate(['/data/positions']);
      }, 1000);
    }, error1 => {
      this.alertService.add('danger', 'There was an error updating the airport, please try again later.');
    });
  }

}
