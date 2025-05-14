import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyEventPage } from './my-event.page';

describe('MyEventPage', () => {
  let component: MyEventPage;
  let fixture: ComponentFixture<MyEventPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MyEventPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
