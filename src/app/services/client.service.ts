import {Injectable, PipeTransform} from '@angular/core';
import {SortDirection} from "../sortable-header/sortable-header.directive";
import {Client} from "../models/Client";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {User} from "../models/User";
import {HttpClient} from "@angular/common/http";
import {DecimalPipe} from "@angular/common";
import {debounceTime, delay, map, switchMap, tap} from "rxjs/operators";
import {CoreResponse} from "../models/CoreResponse";
import {Event} from "../models/Event";

const url = 'https://core.vatpac.org';

interface SearchResult {
  clients: Client[];
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

function sort(clients: Client[], column: string, direction: string): Client[] {
  if (direction === '') {
    return clients;
  } else {
    return [...clients].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(client: Client, term: string, pipe: PipeTransform) {
  return client.sku.toLowerCase().includes(term)
    || client.name.toLowerCase().includes(term)
    || client.description.toString().toLowerCase().includes(term);
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _clients$ = new BehaviorSubject<Client[]>([]);
  private _total$ = new BehaviorSubject<number>(0);

  private _state: State = {
    page: 1,
    pageSize: 5,
    searchTerm: '',
    sortColumn: '',
    sortDirection: ''
  };

  constructor(private http: HttpClient, private pipe: DecimalPipe) {
    this._search$.pipe(
      tap(() => this._loading$.next(true)),
      debounceTime(200),
      switchMap(() => this._search()),
      delay(200),
      tap(() => this._loading$.next(false))
    ).subscribe(result => {
      this._clients$.next(result.clients);
      this._total$.next(result.total);
    });

    this._search$.next();
  }

  public getClients(): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(url + '/client');
  }

  public getClient(sku: string): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(url + '/client/' + sku);
  }

  public deleteClient(sku: string): Observable<CoreResponse> {
    return this.http.delete<CoreResponse>(url + '/client/' + sku);
  }

  public getClientVersion(sku: string): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(url + '/client/' + sku + '/version');
  }

  public deleteClientVersion(sku: string, version: string): Observable<CoreResponse> {
    return this.http.post<CoreResponse>(url + '/client/' + sku + '/delete', {version: version});
  }

  public createClient(sku: string, name: string, description: string): Observable<CoreResponse> {
    return this.http.post<CoreResponse>(url + '/client/create', {sku: sku, name: name, description: description});
  }

  public updateClient(sku: string, name: string, description: string): Observable<CoreResponse> {
    return this.http.patch<CoreResponse>(url + '/client/' + sku, {sku: sku, name: name, description: description});
  }


  get clients$() { return this._clients$.asObservable(); }
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

    return this.getClients().pipe(map(res => {
      if (res.request.result === 'failed') {
        return {clients: [], total: 0};
      }

      let c = res.body.clients as Client[];

      // Set name field
      if (Array.isArray(c)) {
        // 1. sort
        let clients = sort(c, sortColumn, sortDirection);

        // 2. filter
        clients = clients.filter(client => matches(client, searchTerm, this.pipe));
        const total = clients.length;

        // 3. paginate
        clients = clients.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

        return {clients, total};
      } else {
        return {clients: [], total: 0};
      }
    }));
  }

  public refresh() {
    this._search$.next();
  }
}
