import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError, throwError } from 'rxjs';
import { AuthErrorDialogComponent } from '../components/auth-error-dialog/auth-error-dialog.component';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const dialog = inject(MatDialog);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        const isDialogOpen = dialog.openDialogs.some(
          (d) => d.componentInstance instanceof AuthErrorDialogComponent,
        );

        if (!isDialogOpen) {
          dialog.open(AuthErrorDialogComponent, {
            disableClose: true,
            width: '450px',
          });
        }
      }

      return throwError(() => error);
    }),
  );
};
