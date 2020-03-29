import {Injectable, PipeTransform} from '@angular/core';
import {BehaviorSubject, Observable, of, Subject} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {Event, EventForm} from "../models/Event";
import {Router} from "@angular/router";
import {SortDirection} from "../sortable-header/sortable-header.directive";
import {DecimalPipe} from "@angular/common";
import {debounceTime, delay, map, switchMap, tap} from "rxjs/operators";
import {CoreResponse} from "../models/CoreResponse";
import {FormBuilder, FormGroup} from "@angular/forms";
import {AlertService} from "./alert.service";

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
  term = term.toLowerCase();
  return event.title.toLowerCase().includes(term)
    || event.subtitle.toLowerCase().includes(term)
    || (event.start as string).toLowerCase().includes(term)
    || (event.end as string).toLowerCase().includes(term);
}

@Injectable({
  providedIn: 'root'
})
export class EventsService {

  private event: BehaviorSubject<FormGroup | undefined> = new BehaviorSubject(this.fb.group(new EventForm()));
  currentEvent: Observable<FormGroup> = this.event.asObservable();
  private _search$ = new Subject<void>();
  private _state: State = {
    page: 1,
    pageSize: 4,
    searchTerm: '',
    sortColumn: '',
    sortDirection: ''
  };

  constructor(private http: HttpClient, private router: Router, private pipe: DecimalPipe, private fb: FormBuilder, private alertService: AlertService) {
    // setTimeout(() => this.setEvent(new Event()), 0);

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

  private _loading$ = new BehaviorSubject<boolean>(true);

  get loading$() { return this._loading$.asObservable(); }

  private _events$ = new BehaviorSubject<Event[]>([]);

  get events$() { return this._events$.asObservable(); }

  private _total$ = new BehaviorSubject<number>(0);

  get total$() { return this._total$.asObservable(); }

  get page() { return this._state.page; }

  set page(page: number) { this._set({page}); }

  get pageSize() { return this._state.pageSize; }

  set pageSize(pageSize: number) { this._set({pageSize}); }

  get searchTerm() { return this._state.searchTerm; }

  set searchTerm(searchTerm: string) { this._set({searchTerm}); }

  set sortColumn(sortColumn: string) { this._set({sortColumn}); }

  set sortDirection(sortDirection: SortDirection) { this._set({sortDirection}); }

  public getEvents(): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(url + '/all');
  }

  public getEvent(sku: string): Observable<FormGroup> {
    this.http.get<CoreResponse>(url + '/' + sku).subscribe((res) => {
      res = new CoreResponse(res);
      if (!res.success()) {
        this.alertService.add('danger', 'Error getting event. Please try again later.');
        this.router.navigate(['/events']);
      } else {
        let event = res.body.event as Event;

        event.start = new Date(res.body.event.start);
        event.end = new Date(res.body.event.end);

        this.event.next(this.fb.group(new EventForm(event)));
      }
    }, error => {
      this.alertService.add('danger', 'Error getting event. Please try again later.');
      this.router.navigate(['/events']);
    });

    return this.currentEvent;
  }

  public newEvent(): Observable<FormGroup> {
    this.event.next(this.fb.group(new EventForm()));

    return this.currentEvent;
  }

  public deleteEvent(sku): Observable<any> {
    return this.http.delete(`${url}/${sku}`, { withCredentials: true });
  }

  public createEvent(event): Observable<any> {
    return this.http.post<CoreResponse>(`${url}/create`, event, { withCredentials: true });
  }

  public editEvent(id, event): Observable<any> {
    return this.http.post<CoreResponse>(`${url}/${id}`, event, { withCredentials: true });
  }

  public setPosition(sku, userId, position, date, hidden) {
    return this.http.post<CoreResponse>(`${url}/${sku}/setPosition`, {userId: userId, position: position, date: date, hidden: hidden});
  }

  private _set(patch: Partial<State>) {
    Object.assign(this._state, patch);
    this._search$.next();
  }

  private _search(): Observable<SearchResult> {
    const {sortColumn, sortDirection, pageSize, page, searchTerm} = this._state;

    return this.getEvents().pipe(map(res => {
      if (res.request.result === 'failed') {
        return {events: [], total: 0};
      }

      let e = res.body.events as Event[];

      // Set dates to unixtimes
      e = e.map(event => {
        event.start = event.start instanceof Date ? (event.start.getTime()/1000).toString() : (new Date(event.start).getTime()/1000).toString();
        event.end = event.end instanceof Date ? (event.end.getTime()/1000).toString() : (new Date(event.end).getTime()/1000).toString();
        event.published = event.published === 0 ? 'Unpublished' : event.published === 1 ? 'Published - Accepting Applications' : event.published === 2 ? 'Published - Applications Closed' : '';

        return event;
      });

      // 1. sort
      let events = sort(e, sortColumn, sortDirection);

      events = events.map(event => {
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
