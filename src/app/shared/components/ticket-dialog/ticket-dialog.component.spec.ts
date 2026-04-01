import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketDialogComponent } from 'src/app/shared/components/ticket-dialog/ticket-dialog.component';

describe('TicketDialogComponent', () => {
  let component: TicketDialogComponent;
  let fixture: ComponentFixture<TicketDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
