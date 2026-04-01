import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScraperMfaDialogComponent } from './scraper-mfa-dialog.component';

describe('ScraperMfaDialogComponent', () => {
  let component: ScraperMfaDialogComponent;
  let fixture: ComponentFixture<ScraperMfaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScraperMfaDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScraperMfaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
