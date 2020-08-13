import {Injectable, PipeTransform} from '@angular/core';
import {SortDirection} from "../sortable-header/sortable-header.directive";
import {Report} from "../models/Report";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {DecimalPipe} from "@angular/common";
import {debounceTime, delay, map, switchMap, tap} from "rxjs/operators";
import {CoreResponse} from "../models/CoreResponse";
import {HttpClient} from "@angular/common/http";
import {User} from "../models/User";

const url = 'https://core.vatpac.org';

interface SearchResult {
  reports: Report[];
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

function sort(reports: Report[], column: string, direction: string): Report[] {
  if (direction === '') {
    return reports;
  } else {
    return [...reports].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(repot: Report, term: string, pipe: PipeTransform) {
  term = term.toLowerCase();
  return repot.type.toLowerCase().includes(term)
    || repot.author.toString().toLowerCase().includes(term)
    || repot.subject.toString().toLowerCase().includes(term)
    || repot.createdAt.toString().toLowerCase().includes(term);
}

@Injectable({
  providedIn: 'root'
})
export class DiscordService {

  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _reports$ = new BehaviorSubject<Report[]>([]);
  private _total$ = new BehaviorSubject<number>(0);

  private _state: State = {
    page: 1,
    pageSize: 5,
    searchTerm: '',
    sortColumn: '',
    sortDirection: ''
  };

  constructor(private pipe: DecimalPipe, private http: HttpClient) {
    this._search$.pipe(
      tap(() => this._loading$.next(true)),
      debounceTime(200),
      switchMap(() => this._search()),
      delay(200),
      tap(() => this._loading$.next(false))
    ).subscribe(result => {
      this._reports$.next(result.reports);
      this._total$.next(result.total);
    });

    this._search$.next();
  }

  /**
   * Get Reports
   */
  public getReports(): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(`${url}/discord/reports`);
  }

  /**
   * Get Report
   */
  public getReport(id: string): Observable<CoreResponse> {
    return this.http.get<CoreResponse>(`${url}/discord/reports/${id}`);
  }

  public createNote(id: string, content: string): Observable<CoreResponse> {
    return this.http.post<CoreResponse>(url + '/discord/reports/' + id + '/newnote', {note: {content: content}});
  }

  public editNote(id: string, note_id: string, content: string): Observable<CoreResponse> {
    return this.http.patch<CoreResponse>(url + '/discord/reports/' + id + '/editnote/' + note_id, {note: {content: content}});
  }

  public deleteNote(id: string, note_id: string): Observable<CoreResponse> {
    return this.http.delete<CoreResponse>(url + '/discord/reports/' + id + '/deletenote/' + note_id);
  }




  get reports$() { return this._reports$.asObservable(); }
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

    return this.getReports().pipe(map(res => {
      res = new CoreResponse(res);
      if (!res.success()) {
        return {reports: [], total: 0};
      }

      let rep = res.body.reports as Report[];

      // Set name field
      if (Array.isArray(rep)) {
        rep = rep.map(report => {
          report.author = report.author as User;
          report.subject = report.subject as User;

          report.author = (report.author.first_name && report.author.last_name ? report.author.first_name + ' ' + report.author.last_name : report.author.first_name) + ' - ' + report.author.cid;
          report.subject = (report.subject.first_name && report.subject.last_name ? report.subject.first_name + ' ' + report.subject.last_name : report.subject.first_name) + ' - ' + report.subject.cid;
          report.createdAt = report.createdAt instanceof Date ? (report.createdAt.getTime()/1000).toString() : (new Date(report.createdAt).getTime()/1000).toString();

          return report;
        });

        // 1. sort
        let reports = sort(rep, sortColumn, sortDirection);

        reports = reports.map(report => {
          report.createdAt = (new Date(parseInt(report.createdAt as string) * 1000)).toUTCString();

          return report;
        });

        // 2. filter
        reports = reports.filter(report => matches(report, searchTerm, this.pipe));
        const total = reports.length;

        // 3. paginate
        reports = reports.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

        return {reports, total};
      } else {
        return {reports: [], total: 0};
      }
    }));
  }

  public refresh() {
    this._search$.next();
  }

}
