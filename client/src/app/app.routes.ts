import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { roleGuard } from './guards/role.guard';
import { UsersComponent } from './pages/users/users.component';
import { HomeComponent } from './pages/home/home.component';
import { PollListComponent } from './components/poll-list/poll-list.component';
import { PollCreateComponent } from './components/poll-create/poll-create.component';
import { PollDetailComponent } from './components/poll-detail/poll-detail.component';
import { AdminPollListComponent } from './components/admin-poll-list/admin-poll-list.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'poll-list',
    component: PollListComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
  },
  {
    path: 'poll-create',
    component: PollCreateComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
  },
  {
    path: 'poll/:id',
    component: PollDetailComponent,
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
  },
  {
    path: 'polls',
    component: AdminPollListComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
  },
];
