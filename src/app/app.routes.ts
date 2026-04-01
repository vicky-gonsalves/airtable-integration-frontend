import { Routes } from '@angular/router';
import { LoginComponent } from 'src/app/pages/login/login.component';
import { WorkspacesComponent } from 'src/app/pages/workspaces/workspaces.component';
import { BaseDetailComponent } from 'src/app/pages/base-detail/base-detail.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'workspaces', component: WorkspacesComponent },
  { path: 'workspaces/:baseId', component: BaseDetailComponent },
  { path: '**', redirectTo: '' },
];
