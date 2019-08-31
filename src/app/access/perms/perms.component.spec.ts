import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PermsComponent } from './perms.component';

describe('PermsComponent', () => {
  let component: PermsComponent;
  let fixture: ComponentFixture<PermsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PermsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PermsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
