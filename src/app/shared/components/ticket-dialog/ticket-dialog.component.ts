import { Component, Inject, inject, signal } from '@angular/core';
import { AirtableService } from 'src/app/shared/services/airtable/airtable.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe, JsonPipe, KeyValuePipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-ticket-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    KeyValuePipe,
    DatePipe,
    TitleCasePipe,
    JsonPipe,
  ],
  templateUrl: './ticket-dialog.component.html',
  styleUrl: './ticket-dialog.component.scss',
})
export class TicketDialogComponent {
  private airtable = inject(AirtableService);

  revisions = signal<any[]>([]);
  isLoadingRevisions = signal(true);

  constructor(
    public dialogRef: MatDialogRef<TicketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: { id: string; [key: string]: any } },
  ) {}

  ngOnInit() {
    this.airtable.getRevisions().subscribe({
      next: (allRevisions) => {
        const ticketId = this.data.ticket.id;
        const relatedRevisions = allRevisions.filter(
          (rev) => rev.recordId === ticketId || rev.id === ticketId,
        );
        this.revisions.set(relatedRevisions);
        this.isLoadingRevisions.set(false);
      },
      error: () => {
        this.isLoadingRevisions.set(false);
      },
    });
  }
}
