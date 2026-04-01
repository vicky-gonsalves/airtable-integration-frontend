import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AirtableService } from 'src/app/shared/services/airtable/airtable.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRipple } from '@angular/material/core';

@Component({
  selector: 'app-workspaces',
  standalone: true,
  imports: [MatCardModule, MatProgressSpinnerModule, MatToolbarModule, MatIconModule, MatRipple],
  templateUrl: './workspaces.component.html',
  styleUrl: './workspaces.component.scss',
})
export class WorkspacesComponent {
  private airtableService = inject(AirtableService);
  private router = inject(Router);

  bases = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.airtableService.getBases().subscribe({
      next: (res) => {
        this.bases.set(res.bases);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  goToBase(baseId: string) {
    this.router.navigate(['/workspaces', baseId]);
  }
}
