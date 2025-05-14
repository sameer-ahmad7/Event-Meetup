import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileMenuPage } from './profile-menu.page';

describe('ProfileMenuPage', () => {
  let component: ProfileMenuPage;
  let fixture: ComponentFixture<ProfileMenuPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileMenuPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
