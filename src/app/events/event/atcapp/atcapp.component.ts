import {Component, OnInit} from '@angular/core';
import {Event} from "../../../models/Event";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {AirportsService} from "../../../services/airports.service";
import {EventsService} from "../../../services/events.service";
import {Observable, of} from "rxjs";
import {catchError, debounceTime, distinctUntilChanged, map, switchMap} from "rxjs/operators";


@Component({
  selector: 'app-atcapp',
  templateUrl: './atcapp.component.html',
  styleUrls: ['./atcapp.component.scss']
})
export class AtcappComponent implements OnInit {

  model: Event;

  objectKeys = Object.keys;
  typeof = function(el) {
    return typeof el;
  };

  searchFailed = false;

  positions: {icao: string, position: string}[] = [];

  constructor(private airportService: AirportsService, private _modalService: NgbModal, private eventsService: EventsService) {}

  ngOnInit() {
    this.eventsService.currentEvent.subscribe(data => {
      this.model = data;
    });
  }

  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term =>
        this.airportService.getAirportICAOs().pipe(
          map(res => {
            if (Array.isArray(res)) {
              this.searchFailed = false;
              return (term === '' ? res
                : res.filter(v => v.toLowerCase().startsWith(term.toLowerCase()))).slice(0, 10);
            }
          }),
          catchError(() => {
            this.searchFailed = true;
            return of([]);
          })
        )
      ),
    );

  addIcao() {
    if (Object.keys(this.model.positions).length < 6) {
      this.model.positions[''] = {};
    }
  }

  addCallsign(icao: string) {
    if (this.model.positions && this.model.positions[icao]) {
      this.model.positions[icao][''] = {};

      this.eventsService.setEvent(this.model);
    }
  }

  removeIcao(icao: string) {
    if (this.model.positions && this.model.positions[icao]) {
      delete this.model.positions[icao];

      this.eventsService.setEvent(this.model);
    }
  }

  removeCallsign(icao: string, callsign: string) {
    if (this.model.positions && this.model.positions[icao] && this.model.positions[icao][callsign]) {
      delete this.model.positions[icao][callsign];

      this.eventsService.setEvent(this.model);
    }
  }

  confirmClear(content) {
    if (this.positions.length > 0) {
      this._modalService.open(content, {ariaLabelledBy: 'confirm-delete-modal'}).result.then((result) => {
        if (result === 'okClick') {
          this.positions = [];
          this.model.positions = {};

          this.eventsService.setEvent(this.model);
        }
      });
    }
  }

  setIcao(icao: string, text) {
    text = text.target.value;
    if (this.model.positions && this.model.positions[icao] && !this.model.positions[text]) {
      this.model.positions[text] = this.model.positions[icao];
      delete this.model.positions[icao];

      this.eventsService.setEvent(this.model);
    }
  }

  setCallsign(icao: string, callsign: string, text) {
    text = text.target.value;
    if (this.model.positions && this.model.positions[icao] && this.model.positions[icao][callsign] && !this.model.positions[icao][text]) {
      this.model.positions[icao][text] = this.model.positions[icao][callsign];
      delete this.model.positions[icao][callsign];

      this.eventsService.setEvent(this.model);
    }
  }
}
