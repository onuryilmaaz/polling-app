import { Component } from '@angular/core';
import { PollListComponent } from "../../components/poll-list/poll-list.component";

@Component({
  selector: 'app-poll',
  standalone: true,
  imports: [PollListComponent],
  templateUrl: './poll.component.html',
  styleUrl: './poll.component.css',
})
export class PollComponent {}
