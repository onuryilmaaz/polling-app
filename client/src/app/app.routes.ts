import { Routes } from '@angular/router';
import { PollComponent } from './pages/poll/poll.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { CreatePollComponent } from './pages/create-poll/create-poll.component';
import { roleGuard } from './guards/role.guard';
import { UsersComponent } from './pages/users/users.component';

export const routes: Routes = [
  {
    path: '',
    component: PollComponent,
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
    path: 'poll',
    component: PollComponent,
  },
  {
    path: 'create-poll',
    component: CreatePollComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
  },
];
