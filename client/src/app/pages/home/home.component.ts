import { Component } from '@angular/core';
import { PollListComponent } from '../../components/poll-list/poll-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PollListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {}
