import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AirtableService } from 'src/app/shared/services/airtable/airtable.service';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private airtableService = inject(AirtableService);
  private document = inject(DOCUMENT);

  connectAirtable() {
    this.airtableService.getAuthUrl().subscribe((res) => {
      this.document.location.href = res.url;
    });
  }
}
