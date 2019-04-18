import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbCalendar, NgbDate, NgbDateParserFormatter, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Event} from "../../../models/Event";
import {AirportsService} from "../../../services/airports.service";
import {FormControl} from "@angular/forms";
import {Observable, of} from "rxjs";
import {catchError, debounceTime, distinctUntilChanged, map, switchMap} from "rxjs/operators";
import {NgbDateFRParserFormatter} from "../../../injectables/ngb-date-frparser-formatter";
import {FileUploadComponent} from "../../../components/file-upload/file-upload.component";
import {FilesService} from "../../../services/files.service";
import {SafeUrl} from "@angular/platform-browser";
import {EventsService} from "../../../services/events.service";

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.scss'],
  providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})
export class GeneralComponent implements OnInit {

  model: Event;

  hoveredDate: NgbDate;

  fromDate: NgbDate;
  toDate: NgbDate;
  minDate: NgbDate;
  disabledDate: any;

  startTime: any;
  endTime: any;

  depAirport: any;
  arrAirport: any;

  publishOptions = ['Draft', 'Published - Accepting Applications', 'Published - Applications Closed'];

  startTimeCtrl = new FormControl('', (control: FormControl) => {
    const value = control.value;

    if (!value) {
      return null;
    }

    this.startTime = value;
    if (this.model && this.model.start instanceof Date) {
      this.model.start.setUTCHours(this.startTime.hour, this.startTime.minute);
      // this.eventsService.setEvent(this.model);
    }

    return this.isValidTime();
  });

  endTimeCtrl = new FormControl('', (control: FormControl) => {
    const value = control.value;

    if (!value) {
      return null;
    }

    this.endTime = value;
    if (this.model && this.model.end instanceof Date) {
      this.model.end.setUTCHours(this.endTime.hour, this.endTime.minute);
      // this.eventsService.setEvent(this.model);
    }

    return this.isValidTime();
  });

  constructor(private _modalService: NgbModal, public eventsService: EventsService, private calendar: NgbCalendar, private modalService: NgbModal, public filesService: FilesService) {
    this.fromDate = calendar.getToday();
    this.toDate = calendar.getNext(calendar.getToday(), 'd', 3);
    this.minDate = calendar.getToday();

    this.disabledDate = (date: NgbDate, current: { year: number; month: number; }) => date.month === current.month;
  }

  ngOnInit() {
    let set = false;
    this.eventsService.currentEvent.subscribe(data => {
      this.model = data;

      if (!set && this.model && this.model.id && this.model.start instanceof Date && this.model.end instanceof Date) {
        this.startTimeCtrl.setValue({hour: this.model.start.getUTCHours(), minute: this.model.start.getUTCMinutes()});
        this.endTimeCtrl.setValue({hour: this.model.end.getUTCHours(), minute: this.model.end.getUTCMinutes()});

        this.fromDate = NgbDate.from({day: this.model.start.getUTCDate(), month: this.model.start.getUTCMonth()+1, year: this.model.start.getUTCFullYear()});
        this.toDate = NgbDate.from({day: this.model.end.getUTCDate(), month: this.model.end.getUTCMonth()+1, year: this.model.end.getUTCFullYear()});

        set = true;
      }
    });
  }

  addSection() {
    if (this.model.sections.length < 5) {
      this.model.sections.push({title: '', content: '', images: []});
    }
  }

  removeSection(i) {
    if (this.model.sections[i] !== void 0) {
      this.model.sections.splice(i, 1);
    }
  }

  confirmClear(content) {
    if (this.model.sections.length > 0) {
      this._modalService.open(content, {ariaLabelledBy: 'confirm-delete-modal'}).result.then((result) => {
        if (result === 'okClick') {
          this.model.sections = [];

          this.eventsService.setEvent(this.model);
        }
      });
    }
  }

  isValidTime() {
    if (this.model && this.model.start instanceof Date && this.model.end instanceof Date && this.model.start.getUTCDate() === this.model.end.getUTCDate()) {
      if ((this.startTime && this.endTime) && (this.startTime.hour > this.endTime.hour || (this.startTime.hour === this.endTime.hour && this.startTime.minute > this.endTime.minute))) {
        return {startAfterEnd: true};
      }
    }

    return null
  }

  onDateSelection(date: NgbDate) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
    console.log(this.fromDate, this.toDate);

    if (this.model.start instanceof Date && this.fromDate) {
      this.model.start.setUTCFullYear(this.fromDate.year, this.fromDate.month-1, this.fromDate.day);

      if (!this.toDate && this.model.end instanceof Date) {
        this.model.end.setUTCFullYear(this.fromDate.year, this.fromDate.month-1, this.fromDate.day);
      }
      this.eventsService.setEvent(this.model);
    }

    if (this.model.end instanceof Date && this.toDate) {
      this.model.end.setUTCFullYear(this.toDate.year, this.toDate.month-1, this.toDate.day);
      this.eventsService.setEvent(this.model);
    }

    this.startTimeCtrl.updateValueAndValidity();
    this.endTimeCtrl.updateValueAndValidity();
  }

  isHovered(date: NgbDate) {
    return this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate);
  }

  isInside(date: NgbDate) {
    return date.after(this.fromDate) && date.before(this.toDate);
  }

  isRange(date: NgbDate) {
    return date.equals(this.fromDate) || date.equals(this.toDate) || this.isInside(date) || this.isHovered(date);
  }

  getSKU() {
    const title = (this.model.title || '').toLowerCase().replace(/ $/g, '').replace(/ +|_/g, '-');
    const subtitle = (this.model.subTitle || '').toLowerCase().replace(/ $/g, '').replace(/ +|_/g, '-');
    let sku = title;
    if (title.length > 0 && subtitle.length > 0) {
      sku = title + '-' + subtitle;
    } else if (subtitle.length > 0) {
      sku = subtitle;
    } else {
      sku = title;
    }
    sku = sku.replace(/[^\w\s\-]/gi, '');
    sku = sku.replace(/--*/g, '-');

    this.model.sku = sku;
    this.eventsService.setEvent(this.model);

    return sku;
  }

  openUpload(sectionIndex: number) {
    this.modalService.open(FileUploadComponent, {ariaLabelledBy: 'confirm-delete-modal', centered: true}).result.then((result) => {
      for (let img of result) {
        this.filesService.getImage(img).subscribe((res) => {
          this.model.sections[sectionIndex].images.push(res);
        });
      }
    });
  }

  deleteImage(sectionIndex: number, id) {
    this.filesService.deleteImage(id).subscribe((res) => {
      if (res['request'] && res['request']['result'] === 'success') {
        this.model.sections[sectionIndex].images.forEach((val, index) => {
          if (val.id === id) {
            this.model.sections[sectionIndex].images.splice(index, 1);
          }
        })
      }
    })
  }

}
