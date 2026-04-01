import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-error-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './auth-error-dialog.component.html',
  styleUrl: './auth-error-dialog.component.scss',
})
export class AuthErrorDialogComponent {
  private dialogRef = inject(MatDialogRef<AuthErrorDialogComponent>);
  private router = inject(Router);

  goToLogin() {
    this.dialogRef.close();
    this.router.navigate(['/']);
  }
}
