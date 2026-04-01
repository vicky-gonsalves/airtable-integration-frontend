import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  AllCommunityModule,
} from 'ag-grid-community';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AirtableService } from 'src/app/shared/services/airtable/airtable.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AgGridModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatSnackBarModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private airtableService = inject(AirtableService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  private gridApi!: GridApi;

  dashboardForm!: FormGroup;

  integrations = ['Airtable', 'GitHub'];
  collections = ['Tickets', 'Revisions'];

  columnDefs = signal<ColDef[]>([]);
  rowData = signal<any[]>([]);

  bases = signal<any[]>([]);
  tables = signal<any[]>([]);

  ngOnInit(): void {
    this.initForm();
    this.setupFormListeners();
  }

  private initForm() {
    this.dashboardForm = this.fb.group({
      selectedBaseId: [null],
      selectedTableId: [{ value: null, disabled: true }],
      selectedIntegration: ['Airtable'],
      selectedCollection: ['Tickets'],
      searchText: [''],
      email: ['', [Validators.email]],
      password: [''],
      mfaCode: [''],
    });
  }

  private setupFormListeners() {
    this.dashboardForm
      .get('selectedBaseId')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((baseId) => {
        if (baseId) this.onBaseSelected(baseId);
      });

    this.dashboardForm
      .get('selectedCollection')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadData();
      });

    this.dashboardForm
      .get('searchText')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((text) => {
        if (this.gridApi) {
          this.gridApi.setGridOption('quickFilterText', text);
        }
      });
  }

  loadBases() {
    this.airtableService.getBases().subscribe({
      next: (res) => {
        this.bases.set(res.bases);
        this.showMessage('Bases loaded successfully!');
      },
      error: () => this.showMessage('Failed to load bases. Have you connected to Airtable yet?'),
    });
  }

  onBaseSelected(baseId: string) {
    const tableControl = this.dashboardForm.get('selectedTableId');
    tableControl?.setValue(null);
    tableControl?.disable();
    this.tables.set([]);

    this.airtableService.getTables(baseId).subscribe({
      next: (res) => {
        this.tables.set(res.tables);
        if (res.tables.length > 0) {
          tableControl?.enable();
        }
      },
      error: () => this.showMessage('Failed to load tables for this base.'),
    });
  }

  syncData() {
    const { selectedBaseId, selectedTableId } = this.dashboardForm.value;

    if (!selectedBaseId || !selectedTableId) {
      this.showMessage('Please select a Base and Table from the dropdowns first.');
      return;
    }

    this.showMessage('Syncing tickets from Airtable... Please wait.');

    this.airtableService.syncData(selectedBaseId, selectedTableId).subscribe({
      next: () => {
        this.showMessage('Sync complete! Loading data into grid...');
        this.dashboardForm.patchValue({ selectedCollection: 'Tickets' });
        this.loadData();
      },
      error: () => this.showMessage('Failed to sync data.'),
    });
  }

  connectAirtable() {
    this.airtableService.getAuthUrl().subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: () => this.showMessage('Failed to retrieve Auth URL'),
    });
  }

  submitMfa() {
    const { email, password, mfaCode } = this.dashboardForm.value;

    if (!email || !password || !mfaCode) {
      this.showMessage('Please enter Email, Password, and MFA Code');
      return;
    }

    this.showMessage('Authenticating and scraping cookies... this may take a moment.');

    this.airtableService.submitMfa({ email, password, mfaCode }).subscribe({
      next: () => {
        this.showMessage('Scraper Successfully Authenticated! Cookies saved.');
      },
      error: () => this.showMessage('Authentication Failed. Check credentials or MFA.'),
    });
  }

  runScraper() {
    const { selectedBaseId, selectedTableId } = this.dashboardForm.getRawValue();

    if (!selectedBaseId || !selectedTableId) {
      this.showMessage('Please select a Base and Table from the top dropdowns first.');
      return;
    }

    this.showMessage('Running scraper on pages... this will take a moment.');

    this.airtableService.runScraper(selectedBaseId, selectedTableId).subscribe({
      next: (res) => {
        if (res && res.hasMore) {
          this.showMessage(`Batch processed. Processing next batch...`);
        } else {
          this.showMessage('Scraping complete! Loading revision history...');
          this.dashboardForm.patchValue({ selectedCollection: 'Revisions' });
          this.loadData();
        }
      },
      error: () => this.showMessage('Scraper failed. Did you authenticate the cookies first?'),
    });
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  loadData() {
    const collection = this.dashboardForm.get('selectedCollection')?.value;
    const endpoint = collection === 'Tickets' ? 'tickets' : 'revisions';

    this.airtableService.getData(endpoint).subscribe({
      next: (data) => {
        const flattenedData = data.map((item: any) => {
          if (item.fields) {
            return { ...item, ...item.fields };
          }
          return item;
        });

        this.rowData.set(flattenedData);
        this.generateColumns(flattenedData);

        if (data.length === 0) {
          this.showMessage(`No ${collection} found in the database. Did you run the sync?`);
        }
      },
      error: () => this.showMessage(`Failed to load ${collection} from database.`),
    });
  }

  generateColumns(data: any[]) {
    if (!data || data.length === 0) return;

    const firstRow = data[0];
    const newCols = Object.keys(firstRow).map((key) => ({
      field: key,
      headerName: key.charAt(0).toUpperCase() + key.slice(1),
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
    }));

    this.columnDefs.set(newCols);
  }

  private showMessage(msg: string) {
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }
}
