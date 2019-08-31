import {Component, OnDestroy, OnInit} from '@angular/core';
import {Event, EventForm} from "../../../models/Event";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {AirportsService} from "../../../services/airports.service";
import {EventsService} from "../../../services/events.service";
import {Observable, of, Subscription} from "rxjs";
import {catchError, debounceTime, distinctUntilChanged, map, switchMap} from "rxjs/operators";
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {CoreResponse} from "../../../models/CoreResponse";


@Component({
  selector: 'app-atcapp',
  templateUrl: './atcapp.component.html',
  styleUrls: ['./atcapp.component.scss']
})
export class AtcappComponent implements OnInit, OnDestroy {

  event: FormGroup = this.fb.group(new EventForm());
  eventSub: Subscription;

  searchFailed = false;

  constructor(private airportService: AirportsService, private _modalService: NgbModal, private eventsService: EventsService, private fb: FormBuilder) {}

  ngOnInit() {
    this.eventSub = this.eventsService.currentEvent.subscribe(data => {
      this.event = data;
    });
  }

  ngOnDestroy() {
    this.eventSub.unsubscribe()
  }

  get positions() {
    return this.event.controls.available as FormArray;
  }

  get shiftLength() {
    return this.event.controls.shiftLength;
  }

  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term =>
        this.airportService.getAirportPositions().pipe(
          map(icaos => {
            if (icaos === []) this.searchFailed = true;

            return (term === '' ? icaos : icaos.filter(v => v.toLowerCase().startsWith(term.toLowerCase()))).slice(0, 10)
          }),
        )
      ),
    );

  addIcao() {
    this.positions.push(
      new FormControl('', [Validators.maxLength(10), Validators.required])
    );
  }

  removeIcao(i) {
    this.positions.removeAt(i);
  }

  confirmClear(content) {
    if (this.positions.length > 0) {
      this._modalService.open(content, {ariaLabelledBy: 'confirm-delete-modal'}).result.then((result) => {
        if (result === 'okClick') {
          this.positions.clear();
        }
      });
    }
  }
}
