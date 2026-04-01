import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AirtableService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiHost}/airtable`;

  checkAuthStatus(): Observable<{ authenticated: boolean; message: string }> {
    return this.http.get<{ authenticated: boolean; message: string }>(
      `${this.apiUrl}/auth/status`,
      { withCredentials: true },
    );
  }

  getAuthUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.apiUrl}/auth/url`);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true });
  }

  getBases(): Observable<{ bases: any[] }> {
    return this.http.get<{ bases: any[] }>(`${this.apiUrl}/bases`, { withCredentials: true });
  }

  getTables(baseId: string): Observable<{ tables: any[] }> {
    return this.http.get<{ tables: any[] }>(`${this.apiUrl}/tables?baseId=${baseId}`, {
      withCredentials: true,
    });
  }

  syncData(baseId: string, tableId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sync`, { baseId, tableId }, { withCredentials: true });
  }

  getData(endpoint: string, options: any = {}): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${endpoint}`, {
      ...options,
      withCredentials: true,
    });
  }
  getRevisions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/revisions`, { withCredentials: true });
  }
}
