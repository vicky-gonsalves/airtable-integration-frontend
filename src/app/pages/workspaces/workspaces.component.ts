import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRipple } from '@angular/material/core';
import { WorkspaceStateService } from 'src/app/shared/services/workspace-state/workspace-state.service';

@Component({
  selector: 'app-workspaces',
  standalone: true,
  imports: [MatCardModule, MatProgressSpinnerModule, MatToolbarModule, MatIconModule, MatRipple],
  templateUrl: './workspaces.component.html',
  styleUrl: './workspaces.component.scss',
})
export class WorkspacesComponent {
  private workspaceState = inject(WorkspaceStateService);
  private router = inject(Router);

  bases = this.workspaceState.bases;
  isLoading = this.workspaceState.isLoading;

  ngOnInit() {
    this.workspaceState.loadBases();
  }

  goToBase(baseId: string) {
    this.router.navigate(['/workspaces', baseId]);
  }
}
