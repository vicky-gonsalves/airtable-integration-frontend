import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AirtableService } from 'src/app/shared/services/airtable/airtable.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private airtableService = inject(AirtableService);
  private router = inject(Router);
  isChecking = signal(true);

  ngOnInit() {
    this.airtableService.checkAuthStatus().subscribe({
      next: () => this.router.navigate(['/workspaces']),
      error: () => this.isChecking.set(false),
    });
  }

  connectAirtable() {
    this.airtableService.getAuthUrl().subscribe((res) => {
      window.location.href = res.url;
    });
  }
}
