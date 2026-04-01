import { Component } from '@angular/core';
import { DashboardComponent } from 'src/app/dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  imports: [DashboardComponent, DashboardComponent, DashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'airtable-integration-frontend';
}
