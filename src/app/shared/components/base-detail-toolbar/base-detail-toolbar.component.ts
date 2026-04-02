import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-base-detail-toolbar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatToolbarModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
  ],
  templateUrl: './base-detail-toolbar.component.html',
  styleUrl: './base-detail-toolbar.component.scss',
})
export class BaseDetailToolbarComponent {
  @Input() baseId!: string;
  @Input() tableId!: string;
  @Input() bases: any[] = [];
  @Input() tables: any[] = [];
  @Input() isLoaded = false;
  @Input() searchControl!: FormControl;

  @Output() baseChange = new EventEmitter<string>();
  @Output() entityChange = new EventEmitter<string>();
  @Output() clearSearch = new EventEmitter<void>();
}
