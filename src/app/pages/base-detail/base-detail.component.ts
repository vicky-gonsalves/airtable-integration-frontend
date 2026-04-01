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

  currentBaseName = computed(() => {
    const activeBase = this.bases().find((b) => b.id === this.baseId);
    return activeBase ? activeBase.name : 'Tickets';
  });

  tables = computed(() => {
    return this.workspaceState.tablesMap()[this.baseId] || [];
  });

  columnDefs = signal<ColDef[]>([]);
  isSyncing = signal(false);
  totalRows = signal<number>(0);

  searchControl = this.fb.control('');

  private gridApi!: GridApi;
  private isFirstLoad = true;
  private initialUrlParams: any = {};

  ngOnInit() {
    this.workspaceState.loadBases();
    this.initialUrlParams = this.route.snapshot.queryParams;

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const prevTableId = this.tableId;
      this.baseId = params.get('baseId') || '';
      this.tableId = params.get('tableId') || '';

      if (this.baseId) {
        this.workspaceState.loadTables(this.baseId).subscribe((fetchedTables) => {
          if (!this.tableId && fetchedTables.length > 0) {
            this.router.navigate(['/workspaces', this.baseId, fetchedTables[0].id], {
              replaceUrl: true,
              queryParamsHandling: 'merge',
            });
          } else if (
            this.tableId &&
            this.tableId !== prevTableId &&
            this.gridApi &&
            !this.isFirstLoad
          ) {
            this.gridApi.setGridOption('datasource', this.createDatasource());
          }
        });
      }
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((text) => {
        if (!this.isFirstLoad && this.gridApi) {
          this.updateUrlParams({ search: text || null, page: 0 });
          this.gridApi.setGridOption('datasource', this.createDatasource());
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.gridApi.setGridOption('datasource', this.createDatasource());
  }

  createDatasource(): IDatasource {
    return {
      getRows: (params: IGetRowsParams) => {
        const limit = params.endRow - params.startRow;
        const page = Math.floor(params.startRow / limit);

        let sortBy = '',
          sortOrder = '',
          formula = '',
          search: string;

        if (this.isFirstLoad) {
          sortBy = this.initialUrlParams['sortBy'] || '';
          sortOrder = this.initialUrlParams['sortOrder'] || '';
          formula = this.initialUrlParams['formula'] || '';
          search = this.initialUrlParams['search'] || '';
          if (search) this.searchControl.setValue(search, { emitEvent: false });
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

        this.airtable.getData('tickets', { params: apiParams }).subscribe({
          next: (response: any) => {
            const flatData = response.data.map((item: any) => ({
              ...item,
              ...(item.fields || {}),
            }));
            this.totalRows.set(response.total || 0);

            if (this.isFirstLoad) {
              this.setupColumns(flatData);
              setTimeout(() => {
                if (sortBy && sortOrder) {
                  this.gridApi.applyColumnState({
                    state: [{ colId: sortBy, sort: sortOrder as any }],
                    defaultState: { sort: null },
                  });
                }
                if (formula) {
                  const filterModel = AirtableGridFilterUtil.parseFormulaToFilterModel(formula);
                  this.gridApi.setFilterModel(filterModel);
                }
                const urlPage = Number(this.initialUrlParams['page']);
                if (urlPage && urlPage > 0) this.gridApi.paginationGoToPage(urlPage);
              }, 0);
              this.isFirstLoad = false;
            }

            params.successCallback(flatData, response.total);
          },
          error: () => {
            this.snackBar.open('Failed to load tickets', 'Close', { duration: 3000 });
            params.failCallback();
          },
        });
      },
    };
  }

  setupColumns(data: any[]) {
    if (!data.length) return;
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

  onBaseChange(newBaseId: string) {
    this.router.navigate(['/workspaces', newBaseId]);
  }

  onEntityChange(newTableId: string) {
    this.router.navigate(['/workspaces', this.baseId, newTableId], {
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
