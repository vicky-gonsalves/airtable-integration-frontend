import { Routes } from '@angular/router';
import { LoginComponent } from 'src/app/pages/login/login.component';
import { WorkspacesComponent } from 'src/app/pages/workspaces/workspaces.component';
import { BaseDetailComponent } from 'src/app/pages/base-detail/base-detail.component';
import { authGuard } from 'src/app/shared/guards/auth/auth.guard';
import { guestGuard } from 'src/app/shared/guards/guest/guest.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent, canActivate: [guestGuard] },
  {
    path: 'workspaces',
    canActivate: [authGuard],
    children: [
      { path: '', component: WorkspacesComponent },
      { path: ':baseId', component: BaseDetailComponent },
      { path: ':baseId/:tableId', component: BaseDetailComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
