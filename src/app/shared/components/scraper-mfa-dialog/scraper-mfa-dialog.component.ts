import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-scraper-mfa-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './scraper-mfa-dialog.component.html',
  styleUrl: './scraper-mfa-dialog.component.scss',
})
export class ScraperMfaDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ScraperMfaDialogComponent>);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    mfaCode: ['', Validators.required],
  });

  submit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
