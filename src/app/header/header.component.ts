import { Component} from '@angular/core';
import { HeaderService } from './header.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  providers: [HeaderService],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  constructor(protected headerService: HeaderService) {}

}
