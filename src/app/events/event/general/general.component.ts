import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {NgbCalendar, NgbDate, NgbDateAdapter, NgbDateNativeUTCAdapter, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {merge, Observable, of, Subscription} from "rxjs";
import {FileUploadComponent} from "../../../components/file-upload/file-upload.component";
import {FilesService} from "../../../services/files.service";
import {EventsService} from "../../../services/events.service";
import {CoreResponse} from "../../../models/CoreResponse";
import {EventForm} from "../../../models/Event";
import {debounceTime, distinctUntilChanged, map, switchMap} from "rxjs/operators";
import {AirportsService} from "../../../services/airports.service";
import {AlertService} from "../../../services/alert.service";

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.scss'],
  providers: [{provide: NgbDateAdapter, useClass: NgbDateNativeUTCAdapter}]
})
export class GeneralComponent implements OnInit, OnDestroy {

  event: FormGroup = this.fb.group(new EventForm());
  eventSub: Subscription;
  minDate: NgbDate;
  startTime: any;
  endTime: any;
  startTimeCtrl = new FormControl({hour: 0, minute: 0}, [Validators.required, (control: FormControl) => {
    const value = control.value;

    if (!value) {
      return null;
    }

    this.startTime = value;

    let notValid = this.isValidTime();
    if (!notValid) {
      let d = this.event.controls.start.value as Date || new Date();
      d.setUTCHours(value.hour, value.minute);
      this.event.controls.start.setValue(d);
    }

    return notValid;
  }]);
  endTimeCtrl = new FormControl({hour: 0, minute: 0}, [Validators.required, (control: FormControl) => {
    const value = control.value;

    if (!value) {
      return null;
    }

    this.endTime = value;

    let notValid = this.isValidTime();
    if (!notValid) {
      let d = this.event.controls.end.value as Date || new Date();
      d.setUTCHours(value.hour, value.minute);
      this.event.controls.end.setValue(d);
    }

    return notValid;
  }]);
  publishOptions = ['Draft', 'Published - Accepting Applications', 'Published - Applications Closed'];
  searchFailed = false;
  showNotice = false;
  bgLocation;

  tinymceConfig = {
    plugins: 'link image imagetools',
    toolbar: 'image',
    images_upload_url: 'https://core.vatpac.org/files/upload',
    images_upload_credentials: true,
    images_upload_handler: this.filesService.mceUploadFile
  };

  constructor(public eventsService: EventsService, private alertService: AlertService, private airportService: AirportsService, private calendar: NgbCalendar, private modalService: NgbModal, public filesService: FilesService, private fb: FormBuilder, private _modalService: NgbModal) {
    this.start.setValue(new Date());
    this.end.setValue(new Date(Date.now() + 3*86400000));
    this.minDate = calendar.getToday();
  }

  get published() { return this.event ? this.event.controls.published : null }

  get sections() { return this.event ? this.event.controls.sections as FormArray : null }

  get start() { return this.event ? this.event.controls.start : null }

  get end() { return this.event ? this.event.controls.end : null }

  isDisabled = (date: NgbDate, current: {month: number}) => date.before(this.minDate);

  ngOnInit() {
    this.eventSub = this.eventsService.currentEvent.subscribe(data => {

      this.event = data;

      this.startTimeCtrl.setValue({hour: data.controls.start.value.getUTCHours(), minute: data.controls.start.value.getUTCMinutes()});
      this.endTimeCtrl.setValue({hour: data.controls.end.value.getUTCHours(), minute: data.controls.end.value.getUTCMinutes()});

      this.startTime = this.startTimeCtrl.value;
      this.endTime = this.endTimeCtrl.value;

      if (this.event.controls.backgroundImage.value && this.event.controls.backgroundImage.value !== '') this.bgLocation = 'https://core.vatpac.org/files/' + this.event.controls.backgroundImage.value;

      let s = this.start.value as Date;
      if (s.getFullYear() < this.minDate.year || (s.getFullYear() == this.minDate.year && ((s.getMonth()+1 == this.minDate.month && s.getDate() < this.minDate.day) || s.getMonth()+1 < this.minDate.month))) {
        this.minDate = NgbDate.from({day: s.getDate(), month: s.getMonth() + 1, year: s.getFullYear()});
      }

      // this.event.controls.title.setValue(data.title);
      // this.event.controls.subtitle.setValue(data.subtitle);
      // this.event.controls.sku.setValue(data.sku);
      // this.event.controls.published.setValue(data.published || 0);
      //
      // if (data.start instanceof Date && data.end instanceof Date) {
      //   this.start.setValue(data.start);
      //   this.end.setValue(data.end);
      //   this.minDate = NgbDate.from({day: data.start.getDate(), month: data.start.getMonth() + 1, year: data.start.getFullYear()});
      //
      //   this.event.controls.startTime.setValue({hour: data.start.getUTCHours(), minute: data.start.getUTCMinutes()});
      //   this.event.controls.endTime.setValue({hour: data.end.getUTCHours(), minute: data.end.getUTCMinutes()});
      // }
    });

    merge(this.event.controls.title.valueChanges, this.event.controls.subtitle.valueChanges).subscribe(change => {
      const title = this.event.controls.title.value;
      const subtitle = this.event.controls.subtitle.value;
      let sku = title;
      if (title.length > 0 && subtitle.length > 0) {
        sku = title + '-' + subtitle;
      } else if (subtitle.length > 0) {
        sku = subtitle;
      } else {
        sku = title;
      }
      sku = sku.replace(/[^\w\s\-]/gi, '');
      sku = sku.replace(/--*/g, '-').toLowerCase();

      this.event.controls.sku.setValue(sku);
    })
  }

  ngOnDestroy() {
    this.eventSub.unsubscribe()
  }

  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term =>
        this.airportService.getAirportICAOs().pipe(
          map(icaos => {
            if (icaos === []) this.searchFailed = true;

            return (term === '' ? icaos : icaos.filter(v => v.toLowerCase().startsWith(term.toLowerCase()))).slice(0, 10)
          }),
        )
      ),
    );

  get airports() {
    return this.event.controls.airports as FormArray;
  }

  addIcao() {
    this.airports.push(
      new FormGroup({
        airport: new FormControl('', [Validators.maxLength(4), Validators.required]),
        kind: new FormControl('', [Validators.required])
      })
    );
  }

  removeIcao(i) {
    this.airports.removeAt(i);
  }

  confirmClearAirports(content) {
    if (this.airports.length > 0) {
      this._modalService.open(content, {ariaLabelledBy: 'confirm-delete-modal'}).result.then((result) => {
        if (result === 'okClick') {
          this.airports.clear();
        }
      });
    }
  }

  addSection() {
    if (this.sections.length < 5) {
      this.sections.push(new FormGroup({title: new FormControl(''),
        content: new FormControl(''),
        files: new FormArray([])}));
    }
  }

  removeSection(i) {
    if (typeof this.sections.controls[i] !== 'undefined') {
      this.sections.controls.splice(i, 1);
    }
  }

  confirmClearSections(content) {
    if (this.sections.length > 0) {
      this._modalService.open(content, {ariaLabelledBy: 'confirm-delete-modal'}).result.then((result) => {
        if (result === 'okClick') {
          this.sections.controls = [];
        }
      });
    }
  }

  isValidTime() {
    if ((this.start.value instanceof Date && this.end.value instanceof Date) && this.isSameDateAs(this.start.value, this.end.value) &&
      (this.startTime && this.endTime) &&
      (this.startTime.hour > this.endTime.hour ||
        (this.startTime.hour === this.endTime.hour &&
          this.startTime.minute >= this.endTime.minute))) {
      return {startAfterEnd: true};
    }

    return null
  }

  openUpload() {
    const modelRef = this.modalService.open(FileUploadComponent, {ariaLabelledBy: 'upload-image-modal', centered: true});
    modelRef.componentInstance.imagesOnly = true;
    modelRef.result.then((result) => {
      if (result.length === 0) return this.alertService.add('danger', 'There was an error uploading the file, please try again');
      result = result[0];

      this.bgLocation = result;
      this.showNotice = true;
      this.event.controls.backgroundImage.setValue(result.substring(result.lastIndexOf('/') + 1));
    });
  }

  isSameDateAs(iDate, pDate) {
    return (
      iDate.getFullYear() === pDate.getFullYear() &&
      iDate.getMonth() === pDate.getMonth() &&
      iDate.getDate() === pDate.getDate()
    );
  }

}
