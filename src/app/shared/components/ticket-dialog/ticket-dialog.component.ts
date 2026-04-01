import { Component, Inject, inject, signal, OnInit } from '@angular/core';
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
export class TicketDialogComponent implements OnInit {
  private airtable = inject(AirtableService);

  revisions = signal<any[]>([]);
  isLoadingRevisions = signal(true);
  isLoadingMore = signal(false);
  hasMore = signal(false);

  currentPage = 0;
  limit = 20;

  constructor(
    public dialogRef: MatDialogRef<TicketDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { ticket: { id: string; airtableId?: string; [key: string]: any } },
  ) {}

  ngOnInit() {
    this.loadRevisions();
  }

  loadRevisions(loadMore = false) {
    if (loadMore) {
      this.isLoadingMore.set(true);
      this.currentPage++;
    } else {
      this.isLoadingRevisions.set(true);
      this.currentPage = 0;
    }

    const issueId = this.data.ticket.airtableId || this.data.ticket.id;

    this.airtable.getRevisions({ issueId, page: this.currentPage, limit: this.limit }).subscribe({
      next: (response) => {
        const fetchedRevisions = response.data || [];
        const total = response.total || 0;

        if (loadMore) {
          this.revisions.update((prev) => [...prev, ...fetchedRevisions]);
        } else {
          this.revisions.set(fetchedRevisions);
        }

        this.hasMore.set(this.revisions().length < total);
        this.isLoadingRevisions.set(false);
        this.isLoadingMore.set(false);
      },
      error: () => {
        this.isLoadingRevisions.set(false);
        this.isLoadingMore.set(false);
      },
    });
  }

  onScroll(event: Event) {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
      if (this.hasMore() && !this.isLoadingMore() && !this.isLoadingRevisions()) {
        this.loadRevisions(true);
      }
    }
  }
}
