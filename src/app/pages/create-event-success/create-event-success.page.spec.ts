import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateEventSuccessPage } from './create-event-success.page';

describe('CreateEventSuccessPage', () => {
  let component: CreateEventSuccessPage;
  let fixture: ComponentFixture<CreateEventSuccessPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEventSuccessPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
