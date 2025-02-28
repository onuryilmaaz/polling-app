import { Routes } from '@angular/router';
import { PollComponent } from './pages/poll/poll.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { CreatePollComponent } from './pages/create-poll/create-poll.component';
import { roleGuard } from './guards/role.guard';
import { UsersComponent } from './pages/users/users.component';
import { HomeComponent } from './pages/home/home.component';
import { PollListComponent } from './components/poll-list/poll-list.component';
import { PollCreateComponent } from './components/poll-create/poll-create.component';
import { PollDetailComponent } from './components/poll-detail/poll-detail.component';

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
    path: 'poll',
    component: PollComponent,
  },
  {
    path: 'poll-list',
    component: PollListComponent,
  },
  {
    path: 'poll-create',
    component: PollCreateComponent,
  },
  {
    path: 'poll/:id',
    component: PollDetailComponent,
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
