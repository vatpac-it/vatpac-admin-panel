import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReserveATCComponent } from './reserve-atc.component';

describe('ReserveATCComponent', () => {
  let component: ReserveATCComponent;
  let fixture: ComponentFixture<ReserveATCComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReserveATCComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReserveATCComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
