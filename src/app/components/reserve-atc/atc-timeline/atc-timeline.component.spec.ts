import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AtcTimelineComponent } from './atc-timeline.component';

describe('AtcTimelineComponent', () => {
  let component: AtcTimelineComponent;
  let fixture: ComponentFixture<AtcTimelineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AtcTimelineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AtcTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
