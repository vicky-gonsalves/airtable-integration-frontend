import { Component, inject, Input, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AirtableService } from 'src/app/shared/services/airtable/airtable.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AgGridModule } from 'ag-grid-angular';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  GridReadyEvent,
  CellClickedEvent,
  IDatasource,
  IGetRowsParams,
  ModuleRegistry,
} from 'ag-grid-community';
import { TicketDialogComponent } from 'src/app/shared/components/ticket-dialog/ticket-dialog.component';
import { WorkspaceStateService } from 'src/app/shared/services/workspace-state/workspace-state.service';
import { AirtableGridFilterUtil } from 'src/app/shared/utils/airtable-grid-filter.util';
import { ScraperMfaDialogComponent } from 'src/app/shared/components/scraper-mfa-dialog/scraper-mfa-dialog.component';

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
    RouterModule,
  ],
  templateUrl: './base-detail.component.html',
  styleUrl: './base-detail.component.scss',
})
export class BaseDetailComponent implements OnInit, OnDestroy {
  @Input() baseId!: string;
  @Input() tableId: string = '';

  private airtable = inject(AirtableService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private workspaceState = inject(WorkspaceStateService);
  private destroy$ = new Subject<void>();

  bases = this.workspaceState.bases;
  isLoaded = this.workspaceState.isLoaded;

  activeBaseId = signal<string>('');
  activeTableId = signal<string>('');

  currentBaseName = computed(() => {
    const activeBase = this.bases().find((b) => b.id === this.activeBaseId());
    return activeBase ? activeBase.name : 'Workspace';
  });

  tables = computed(() => {
    return this.workspaceState.tablesMap()[this.activeBaseId()] || [];
  });

  currentTableName = computed(() => {
    const activeTable = this.tables().find((t) => t.id === this.activeTableId());
    return activeTable ? activeTable.name : 'Collection';
  });

  columnDefs = signal<ColDef[]>([]);
  isSyncing = signal(false);
  totalRows = signal<number>(0);
  isLoadingData = signal<boolean>(true);
  hasActiveFilters = signal<boolean>(false);

  searchControl = this.fb.control('');

  private gridApi!: GridApi;

  private lastFetchParams: string | null = null;
  private lastFetchResponse: { data: any[]; total: number } | null = null;

  ngOnInit() {
    this.workspaceState.loadBases();

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const prevBaseId = this.baseId;
      const prevTableId = this.tableId;
      this.baseId = params.get('baseId') || '';
      this.tableId = params.get('tableId') || '';

      this.activeBaseId.set(this.baseId);
      this.activeTableId.set(this.tableId);

      if (this.baseId) {
        this.workspaceState.loadTables(this.baseId).subscribe((fetchedTables) => {
          if (!this.tableId && fetchedTables.length > 0) {
            this.router.navigate(['/workspaces', this.baseId, fetchedTables[0].id], {
              replaceUrl: true,
              queryParamsHandling: 'merge',
            });
          } else if (this.tableId && (this.tableId !== prevTableId || this.baseId !== prevBaseId)) {
            this.resetGridState();

            if (this.gridApi) {
              this.loadTableData();
            }
          }
        });
      }
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((text) => {
        if (this.gridApi) {
          this.updateUrlParams({ search: text || null, page: 0 });
          this.gridApi.setGridOption('datasource', this.createDatasource());
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetGridState() {
    this.columnDefs.set([]);
    this.totalRows.set(0);
    this.isLoadingData.set(true);
    this.hasActiveFilters.set(false);
    this.lastFetchParams = null;
    this.lastFetchResponse = null;
    this.searchControl.setValue('', { emitEvent: false });
  }

  updateUrlParams(newParams: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: newParams,
      queryParamsHandling: 'merge',
    });
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    if (this.tableId) {
      this.loadTableData();
    }
  }

  private loadTableData() {
    if (!this.tableId || !this.gridApi) return;

    this.isLoadingData.set(true);

    const queryParams = this.route.snapshot.queryParams;
    const page = Number(queryParams['page']) || 0;
    const limit = Number(queryParams['limit']) || 20;
    const search = queryParams['search'] || '';
    const sortBy = queryParams['sortBy'] || '';
    const sortOrder = queryParams['sortOrder'] || '';
    const formula = queryParams['formula'] || '';

    this.hasActiveFilters.set(!!search || !!formula);

    if (search && this.searchControl.value !== search) {
      this.searchControl.setValue(search, { emitEvent: false });
    }

    const initialParams = {
      baseId: this.baseId,
      tableId: this.tableId,
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      formula,
    };

    this.airtable.getData('tickets', { params: initialParams }).subscribe({
      next: (response: any) => {
        const flatData = response.data.map((item: any) => ({
          ...item,
          ...(item.fields || {}),
        }));
        this.totalRows.set(response.total || 0);

        this.lastFetchParams = JSON.stringify(initialParams);
        this.lastFetchResponse = { data: flatData, total: response.total };

        this.setupColumns(flatData);

        setTimeout(() => {
          if (initialParams.sortBy && initialParams.sortOrder) {
            this.gridApi.applyColumnState({
              state: [{ colId: initialParams.sortBy, sort: initialParams.sortOrder as any }],
            });
          } else {
            this.gridApi.applyColumnState({ defaultState: { sort: null } });
          }

          if (initialParams.formula) {
            const filterModel = AirtableGridFilterUtil.parseFormulaToFilterModel(
              initialParams.formula,
            );
            this.gridApi.setFilterModel(filterModel);
          } else {
            this.gridApi.setFilterModel(null);
          }

          this.gridApi.setGridOption('datasource', this.createDatasource(initialParams));

          if (page > 0) {
            setTimeout(() => this.gridApi.paginationGoToPage(page), 50);
          }

          this.isLoadingData.set(false);
        }, 50);
      },
      error: () => {
        this.snackBar.open('Failed to load table data', 'Close', { duration: 3000 });
        this.isLoadingData.set(false);
      },
    });
  }

  createDatasource(initialState?: any): IDatasource {
    let isFirstCall = !!initialState;

    return {
      getRows: (params: IGetRowsParams) => {
        const limit = params.endRow - params.startRow;
        const page = Math.floor(params.startRow / limit);

        let sortBy = '';
        let sortOrder = '';
        let formula = '';
        let search = '';

        if (isFirstCall) {
          sortBy = initialState.sortBy;
          sortOrder = initialState.sortOrder;
          formula = initialState.formula;
          search = initialState.search;
          isFirstCall = false;
        } else {
          if (params.sortModel && params.sortModel.length > 0) {
            sortBy = params.sortModel[0].colId;
            sortOrder = params.sortModel[0].sort;
          }

          const filterModel = params.filterModel;
          formula =
            Object.keys(filterModel).length > 0
              ? AirtableGridFilterUtil.convertGridFiltersToFormula(filterModel)
              : '';

          search = this.searchControl.value || '';

          this.hasActiveFilters.set(!!search || !!formula);

          this.updateUrlParams({
            page,
            limit,
            sortBy: sortBy || null,
            sortOrder: sortOrder || null,
            formula: formula || null,
          });
        }

        const apiParams = {
          baseId: this.baseId,
          tableId: this.tableId,
          page,
          limit,
          sortBy,
          sortOrder,
          search,
          formula,
        };

        const cacheKey = JSON.stringify(apiParams);

        if (this.lastFetchParams === cacheKey && this.lastFetchResponse) {
          params.successCallback(this.lastFetchResponse.data, this.lastFetchResponse.total);
          return;
        }

        this.airtable.getData('tickets', { params: apiParams }).subscribe({
          next: (response: any) => {
            const flatData = response.data.map((item: any) => ({
              ...item,
              ...(item.fields || {}),
            }));

            this.totalRows.set(response.total || 0);
            if (this.columnDefs().length === 0 && flatData.length > 0) {
              this.setupColumns(flatData);
            }

            this.lastFetchParams = cacheKey;
            this.lastFetchResponse = { data: flatData, total: response.total };

            params.successCallback(flatData, response.total);
          },
          error: () => {
            this.snackBar.open('Failed to load table data', 'Close', { duration: 3000 });
            params.failCallback();
          },
        });
      },
    };
  }

  setupColumns(data: any[]) {
    if (!data || !data.length) {
      if (!this.hasActiveFilters()) {
        this.columnDefs.set([]);
        if (this.gridApi) this.gridApi.setGridOption('columnDefs', []);
      }
      return;
    }

    const allKeys = new Set<string>();
    data.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (!['fields', 'createdTime', '_id', '__v', 'baseId', 'tableId'].includes(key)) {
          allKeys.add(key);
        }
      });
    });

    const cols: ColDef[] = [
      {
        headerName: '',
        field: '_row_header',
        width: 70,
        sortable: false,
        filter: false,
        valueGetter: 'node.rowIndex + 1',
        cellRenderer: (params: any) =>
          `<div class="row-header-cell"><span class="row-number">${params.value}</span><button class="hover-expand-btn"><span class="material-icons" style="font-size: 16px;">open_in_full</span></button></div>`,
      },
      ...Array.from(allKeys).map((key) => ({
        field: key,
        headerName: key.toUpperCase(),
        sortable: true,
        filter: 'agTextColumnFilter',
        floatingFilter: false,
        filterParams: { buttons: ['reset'], debounceMs: 600, maxNumConditions: 10 },

        valueFormatter: (params: any) => {
          const val = params.value;

          if (!val) return '';

          if (Array.isArray(val)) {
            return val
              .map((v) => (v && typeof v === 'object' ? v.name || v.email || JSON.stringify(v) : v))
              .join(', ');
          }

          if (typeof val === 'object') {
            return val.name || val.email || JSON.stringify(val);
          }

          return val;
        },
      })),
    ];

    this.columnDefs.set(cols);
    if (this.gridApi) this.gridApi.setGridOption('columnDefs', cols);
  }

  onCellClicked(event: CellClickedEvent) {
    const target = event.event?.target as HTMLElement;
    if (target && target.closest('.hover-expand-btn')) {
      this.dialog.open(TicketDialogComponent, {
        width: '1000px',
        maxWidth: '90vw',
        data: { ticket: event.data },
      });
    }
  }

  clearFilters() {
    this.searchControl.setValue('', { emitEvent: false });
    this.hasActiveFilters.set(false);
    this.updateUrlParams({ search: null, formula: null, page: 0 });

    if (this.gridApi) {
      this.gridApi.setFilterModel(null);

      setTimeout(() => {
        this.gridApi.setGridOption('datasource', this.createDatasource());
      }, 50);
    }
  }

  onBaseChange(newBaseId: string) {
    this.router.navigate(['/workspaces', newBaseId], {
      queryParams: { page: null, sortBy: null, sortOrder: null, formula: null, search: null },
      queryParamsHandling: 'merge',
    });
  }

  onEntityChange(newTableId: string) {
    this.router.navigate(['/workspaces', this.baseId, newTableId], {
      queryParams: { page: null, sortBy: null, sortOrder: null, formula: null, search: null },
      queryParamsHandling: 'merge',
    });
  }

  syncCurrentBase() {
    if (!this.tableId) return;
    this.isSyncing.set(true);

    this.airtable.syncData(this.baseId, this.tableId).subscribe({
      next: () => {
        this.snackBar.open('Sync successful!', 'Close', { duration: 2000 });
        this.isSyncing.set(false);
        if (this.gridApi) {
          this.isLoadingData.set(true);
          this.lastFetchParams = null;
          this.lastFetchResponse = null;
          this.gridApi.setGridOption('datasource', this.createDatasource());
        }
      },
      error: () => {
        this.snackBar.open('Sync failed. Please try again.', 'Close', { duration: 3000 });
        this.isSyncing.set(false);
      },
    });
  }

  syncRevisionHistory() {
    const dialogRef = this.dialog.open(ScraperMfaDialogComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe((credentials) => {
      if (credentials) {
        this.isSyncing.set(true);
        this.airtable.submitMfa(credentials).subscribe({
          next: () => this.processScraperQueue(this.baseId, this.tableId),
          error: () => {
            this.snackBar.open('Authentication failed. Check credentials.', 'Close', {
              duration: 4000,
            });
            this.isSyncing.set(false);
          },
        });
      }
    });
  }

  private processScraperQueue(baseId: string, tableId: string, cursor?: string) {
    this.airtable.runScraper(baseId, tableId, cursor).subscribe({
      next: (res) => {
        if (res.hasMore && res.cursor) {
          this.processScraperQueue(baseId, tableId, res.cursor);
        } else {
          this.snackBar.open('Revision history sync completed successfully!', 'Close', {
            duration: 3000,
          });
          this.isSyncing.set(false);
          if (this.gridApi) {
            this.isLoadingData.set(true);
            this.lastFetchParams = null;
            this.lastFetchResponse = null;
            this.gridApi.setGridOption('datasource', this.createDatasource());
          }
        }
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          this.snackBar.open('Session expired or cookies invalid. Please resync.', 'Close', {
            duration: 5000,
          });
        } else {
          this.snackBar.open('Scraping interrupted or rate limit hit. Try again later.', 'Close', {
            duration: 5000,
          });
        }
        this.isSyncing.set(false);
      },
    });
  }
}
