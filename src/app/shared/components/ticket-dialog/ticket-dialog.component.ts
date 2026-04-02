import { Component, Inject, inject, signal, OnInit } from '@angular/core';
import { AirtableService } from 'src/app/shared/services/airtable/airtable.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, KeyValuePipe, NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-ticket-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatIconModule,
    KeyValuePipe,
    DatePipe,
    NgTemplateOutlet,
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

  isArray(val: unknown): boolean {
    return Array.isArray(val);
  }

  isObject(val: unknown): boolean {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  }

  formatKey(key: unknown): string {
    const strKey = String(key);
    const result = strKey.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  isDateString(val: unknown): boolean {
    if (typeof val !== 'string') return false;
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return isoDateRegex.test(val);
  }
}
