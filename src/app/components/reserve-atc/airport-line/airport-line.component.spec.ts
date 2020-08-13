import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AirportLineComponent } from './airport-line.component';

describe('AirportLineComponent', () => {
  let component: AirportLineComponent;
  let fixture: ComponentFixture<AirportLineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AirportLineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AirportLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
