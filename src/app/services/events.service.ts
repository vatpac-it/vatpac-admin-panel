import {Injectable, PipeTransform} from '@angular/core';
import {BehaviorSubject, Observable, of, Subject} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {Event} from "../models/Event";
import {Router} from "@angular/router";
import {SortDirection} from "./sortable-header.directive";
import {DecimalPipe} from "@angular/common";
import {debounceTime, delay, map, switchMap, tap} from "rxjs/operators";

const url = 'https://core.vatpac.org/events';

interface SearchResult {
  events: Event[];
  total: number;
}

interface State {
  page: number;
  pageSize: number;
  searchTerm: string;
  sortColumn: string;
  sortDirection: SortDirection;
}

function compare(v1, v2) {
  return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
}

function sort(events: Event[], column: string, direction: string): Event[] {
  if (direction === '') {
    return events;
  } else {
    return [...events].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(event: Event, term: string, pipe: PipeTransform) {
  return event.title.toLowerCase().includes(term)
    || event.subTitle.toLowerCase().includes(term)
    || (event.start as string).toLowerCase().includes(term)
    || (event.end as string).toLowerCase().includes(term);
}

@Injectable({
  providedIn: 'root'
})
export class EventsService {

  private event: BehaviorSubject<Event> = new BehaviorSubject(new Event());
  currentEvent = this.event.asObservable();

  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _events$ = new BehaviorSubject<Event[]>([]);
  private _total$ = new BehaviorSubject<number>(0);

  private _state: State = {
    page: 1,
    pageSize: 4,
    searchTerm: '',
    sortColumn: '',
    sortDirection: ''
  };

  constructor(private http: HttpClient, private router: Router, private pipe: DecimalPipe) {
    setTimeout(() => this.setEvent(new Event()), 0);

    this._search$.pipe(
      tap(() => this._loading$.next(true)),
      debounceTime(200),
      switchMap(() => this._search()),
      delay(200),
      tap(() => this._loading$.next(false))
    ).subscribe(result => {
      this._events$.next(result.events);
      this._total$.next(result.total);
    });

    this._search$.next();
  }

  public setEvent(event: Event) {
    this.event.next(event);
  }

  public getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(url);
  }

  public getEvent(sku: string): Observable<Event> {
    this.http.get<Event>(url + '/' + sku).subscribe(res => {
      if (res['returns'] && res['returns'] === 'failed') {
        this.router.navigate(['/events']);
      } else {
        res.start = new Date(res.start);
        res.end = new Date(res.end);

        this.setEvent(res);
      }
    });

    return this.currentEvent;
  }

  public refreshEvent(): Observable<Event> {
    this.currentEvent.subscribe(event => {
      this.http.get<Event>(url + '/' + event.sku).subscribe(res => {
        if (res['returns'] && res['returns'] === 'failed') {
          this.router.navigate(['/events']);
        } else {
          res.start = new Date(res.start);
          res.end = new Date(res.end);

          this.setEvent(res);
        }
      });
    });

    return this.currentEvent;
  }

  public createEvent(event): Observable<any> {
    return this.http.post(`${url}/create`, event, { withCredentials: true });
  }

  public editEvent(event): Observable<any> {
    return this.http.post(`${url}/edit`, event, { withCredentials: true });
  }

  public setPosition(event_sku, cid, icao, position, date, start, end) {
    return this.http.post(`${url}/${event_sku}/setPosition`, {'icao': icao, 'userCid': cid, 'position': position, 'position_date': date, 'position_start': start, 'position_end': end, 'position_data_hidden': 0});
  }

  get events$() { return this._events$.asObservable(); }
  get total$() { return this._total$.asObservable(); }
  get loading$() { return this._loading$.asObservable(); }
  get page() { return this._state.page; }
  get pageSize() { return this._state.pageSize; }
  get searchTerm() { return this._state.searchTerm; }

  set page(page: number) { this._set({page}); }
  set pageSize(pageSize: number) { this._set({pageSize}); }
  set searchTerm(searchTerm: string) { this._set({searchTerm}); }
  set sortColumn(sortColumn: string) { this._set({sortColumn}); }
  set sortDirection(sortDirection: SortDirection) { this._set({sortDirection}); }

  private _set(patch: Partial<State>) {
    Object.assign(this._state, patch);
    this._search$.next();
  }

  private _search(): Observable<SearchResult> {
    const {sortColumn, sortDirection, pageSize, page, searchTerm} = this._state;

    return this.getEvents().pipe(map(res => {
      if (res['returns'] === 'failed') {
        return {events: [], total: 0};
      }
      // Set dates to unixtimes
      res = res.filter(event => {
        event.start = event.start instanceof Date ? (event.start.getTime()/1000).toString() : (new Date(event.start).getTime()/1000).toString();
        event.end = event.end instanceof Date ? (event.end.getTime()/1000).toString() : (new Date(event.end).getTime()/1000).toString();
        event.published = event.published === 0 ? 'Unpublished' : event.published === 1 ? 'Published - Accepting Applications' : event.published === 2 ? 'Published - Applications Closed' : '';

        return event;
      });

      // 1. sort
      let events = sort(res, sortColumn, sortDirection);

      events = events.filter(event => {
        event.start = (new Date(parseInt(event.start as string) * 1000)).toUTCString();
        event.end = (new Date(parseInt(event.end as string) * 1000)).toUTCString();

        return event;
      });

      // 2. filter
      events = events.filter(event => matches(event, searchTerm, this.pipe));
      const total = events.length;

      // 3. paginate
      events = events.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

      return {events, total};
    }));
  }

}
