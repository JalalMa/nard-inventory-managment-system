import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from './core/services/language.service';
import { SocketService } from './core/services/socket.service';
import { ToastContainer } from './shared/components/toast-container/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly language = inject(LanguageService);
  private readonly socket = inject(SocketService);

  ngOnInit(): void {
    this.language.init();
    this.socket.connect();
  }
}
