import { Injectable, inject, signal } from '@angular/core';
import { AirtableService } from 'src/app/shared/services/airtable/airtable.service';
import {
  AirtableBase,
  AirtableBasesResponse,
} from 'src/app/shared/interfaces/airtable-base.interface';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceStateService {
  private airtableService = inject(AirtableService);

  private _bases = signal<AirtableBase[]>([]);
  private _isLoading = signal<boolean>(false);
  private _isLoaded = signal<boolean>(false);

  private _tablesMap = signal<Record<string, any[]>>({});

  public readonly bases = this._bases.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();
  public readonly isLoaded = this._isLoaded.asReadonly();
  public readonly tablesMap = this._tablesMap.asReadonly();

  loadBases() {
    if (this._isLoaded() || this._isLoading()) {
      return;
    }

    this._isLoading.set(true);

    this.airtableService.getBases().subscribe({
      next: (res: AirtableBasesResponse) => {
        this._bases.set(res.bases);
        this._isLoaded.set(true);
        this._isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load workspaces', err);
        this._isLoading.set(false);
      },
    });
  }

  loadTables(baseId: string): Observable<any[]> {
    const existingTables = this._tablesMap()[baseId];
    if (existingTables && existingTables.length > 0) {
      return of(existingTables);
    }

    return this.airtableService.getTables(baseId).pipe(
      tap((res: any) => {
        this._tablesMap.update((map) => ({ ...map, [baseId]: res.tables }));
      }),
      map((res: any) => res.tables),
    );
  }
}
