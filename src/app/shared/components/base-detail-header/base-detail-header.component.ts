import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-base-detail-header',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, DatePipe],
  templateUrl: './base-detail-header.component.html',
  styleUrl: './base-detail-header.component.scss',
})
export class BaseDetailHeaderComponent {
  @Input() currentTableName: string = '';
  @Input() syncMeta: any = null;
  @Input() isSyncing: boolean = false;
  @Input() tableId: string = '';

  @Output() syncRevisionHistory = new EventEmitter<void>();
  @Output() syncCurrentBase = new EventEmitter<void>();
}
