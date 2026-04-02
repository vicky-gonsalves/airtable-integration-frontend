import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRipple } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { WorkspaceStateService } from 'src/app/shared/services/workspace-state/workspace-state.service';
import { AirtableService } from 'src/app/shared/services/airtable/airtable.service';

@Component({
  selector: 'app-workspaces',
  standalone: true,
  imports: [
    MatCardModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatIconModule,
    MatRipple,
    MatButtonModule,
  ],
  templateUrl: './workspaces.component.html',
  styleUrl: './workspaces.component.scss',
})
export class WorkspacesComponent implements OnInit {
  private workspaceState = inject(WorkspaceStateService);
  private router = inject(Router);
  private airtableService = inject(AirtableService);

  bases = this.workspaceState.bases;
  isLoading = this.workspaceState.isLoading;

  ngOnInit() {
    this.workspaceState.loadBases();
  }

  goToBase(baseId: string) {
    this.router.navigate(['/workspaces', baseId]);
  }

  logout() {
    this.airtableService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {
        this.router.navigate(['/']);
      },
    });
  }
}
