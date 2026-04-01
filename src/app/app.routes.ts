import { Routes } from '@angular/router';
import { LoginComponent } from 'src/app/login/login.component';
import { WorkspacesComponent } from 'src/app/workspaces/workspaces.component';
import { BaseDetailComponent } from 'src/app/base-detail/base-detail.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'workspaces', component: WorkspacesComponent },
  { path: 'workspaces/:baseId', component: BaseDetailComponent },
  { path: '**', redirectTo: '' },
];
