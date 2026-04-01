import { Component, inject, Input, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AirtableService } from 'src/app/shared/services/airtable/airtable.service';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AgGridModule } from 'ag-grid-angular';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  CellClickedEvent,
} from 'ag-grid-community';
import { TicketDialogComponent } from 'src/app/shared/components/ticket-dialog/ticket-dialog.component';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-base-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatToolbarModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    AgGridModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './base-detail.component.html',
  styleUrl: './base-detail.component.scss',
})
export class BaseDetailComponent {
  @Input() baseId!: string;

  private airtable = inject(AirtableService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  bases = signal<any[]>([]);
  rowData = signal<any[]>([]);
  columnDefs = signal<ColDef[]>([]);
  isLoading = signal(true);
  isSyncing = signal(false);

  searchControl = this.fb.control('');
  private gridApi!: GridApi;

  ngOnInit() {
    this.airtable.getBases().subscribe((res) => this.bases.set(res.bases));
    this.loadTickets();
    this.searchControl.valueChanges.subscribe((text) => {
      if (this.gridApi) this.gridApi.setGridOption('quickFilterText', text || '');
    });
  }

  loadTickets() {
    this.isLoading.set(true);
    this.airtable.getData('tickets').subscribe({
      next: (data) => {
        const flatData = data.map((item) => ({ ...item, ...(item.fields || {}) }));
        this.rowData.set(flatData);
        this.setupColumns(flatData);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load tickets', 'Close', { duration: 3000 });
        this.isLoading.set(false);
      },
    });
  }

  setupColumns(data: any[]) {
    if (!data.length) return;
    const keys = Object.keys(data[0]).filter((k) => k !== 'fields' && k !== 'createdTime');

    const cols: ColDef[] = [
      {
        headerName: '',
        field: '_row_header',
        width: 70,
        sortable: false,
        filter: false,
        valueGetter: 'node.rowIndex + 1',
        cellRenderer: (params: any) => {
          return `
            <div class="row-header-cell">
              <span class="row-number">${params.value}</span>
              <button class="hover-expand-btn" title="Expand Record">
                <span class="material-icons" style="font-size: 16px;">open_in_full</span>
              </button>
            </div>
          `;
        },
      },
      ...keys.map((key) => ({
        field: key,
        headerName: key.toUpperCase(),
        sortable: true,
        filter: true,
      })),
    ];

    this.columnDefs.set(cols);
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  onCellClicked(event: CellClickedEvent) {
    const target = event.event?.target as HTMLElement;
    if (target && target.closest('.hover-expand-btn')) {
      this.dialog.open(TicketDialogComponent, {
        width: '800px',
        data: { ticket: event.data },
      });
    }
  }

  onEntityChange(newBaseId: string) {
    this.router.navigate(['/workspaces', newBaseId]);
  }

  syncCurrentBase() {
    this.isSyncing.set(true);
    this.airtable.getTables(this.baseId).subscribe({
      next: (res) => {
        if (!res.tables || res.tables.length === 0) {
          this.snackBar.open('No tables found in this base to sync.', 'Close', { duration: 3000 });
          this.isSyncing.set(false);
          return;
        }
        const firstTableId = res.tables[0].id;

        this.airtable.syncData(this.baseId, firstTableId).subscribe({
          next: () => {
            this.snackBar.open('Sync successful!', 'Close', { duration: 2000 });
            this.isSyncing.set(false);
            this.loadTickets(); // Reload grid
          },
          error: () => {
            this.snackBar.open('Sync failed. Please try again.', 'Close', { duration: 3000 });
            this.isSyncing.set(false);
          },
        });
      },
      error: () => {
        this.snackBar.open('Failed to fetch tables to start sync.', 'Close', { duration: 3000 });
        this.isSyncing.set(false);
      },
    });
  }
}
