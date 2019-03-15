import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AtcappComponent } from './atcapp.component';

describe('AtcappComponent', () => {
  let component: AtcappComponent;
  let fixture: ComponentFixture<AtcappComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AtcappComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AtcappComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
