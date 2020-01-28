import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotamsComponent } from './notams.component';

describe('NotamsComponent', () => {
  let component: NotamsComponent;
  let fixture: ComponentFixture<NotamsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotamsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
