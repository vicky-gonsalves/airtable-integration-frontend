import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AirtableService } from 'src/app/shared/services/airtable/airtable.service';
import { catchError, map, of } from 'rxjs';

export const guestGuard: CanActivateFn = () => {
  const airtableService = inject(AirtableService);
  const router = inject(Router);

  return airtableService.checkAuthStatus().pipe(
    map(() => router.createUrlTree(['/workspaces'])),
    catchError(() => of(true)),
  );
};
