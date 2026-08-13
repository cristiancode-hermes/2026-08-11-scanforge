import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from '../shared/toast-container.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <div class="auth-split">
      <aside class="auth-visual">
        <svg class="auth-visual-svg" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="sf-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#0B1526"/>
              <stop offset="100%" stop-color="#0E4C5F"/>
            </linearGradient>
            <radialGradient id="sf-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#22D3EE" stop-opacity="0.32"/>
              <stop offset="100%" stop-color="#22D3EE" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="600" height="800" fill="url(#sf-bg)"/>
          <circle cx="300" cy="380" r="280" fill="url(#sf-glow)"/>
          <g stroke="#22D3EE" stroke-opacity="0.22" stroke-width="1">
            <line x1="387" y1="174" x2="368" y2="87"/>
            <line x1="387" y1="174" x2="347" y2="263"/>
            <line x1="72" y1="341" x2="185" y2="288"/>
            <line x1="72" y1="341" x2="104" y2="492"/>
            <line x1="72" y1="341" x2="107" y2="283"/>
            <line x1="185" y1="288" x2="107" y2="283"/>
            <line x1="185" y1="288" x2="274" y2="285"/>
            <line x1="131" y1="164" x2="76" y2="90"/>
            <line x1="131" y1="164" x2="107" y2="283"/>
            <line x1="406" y1="618" x2="179" y2="577"/>
            <line x1="406" y1="618" x2="426" y2="618"/>
            <line x1="104" y1="492" x2="179" y2="577"/>
            <line x1="76" y1="90" x2="107" y2="283"/>
            <line x1="179" y1="577" x2="426" y2="618"/>
            <line x1="368" y1="87" x2="347" y2="263"/>
            <line x1="347" y1="263" x2="274" y2="285"/>
            <line x1="347" y1="263" x2="289" y2="344"/>
            <line x1="274" y1="285" x2="289" y2="344"/>
          </g>
          <path d="M300 560 A 190 190 0 0 1 490 370 L 300 370 Z" fill="#22D3EE" fill-opacity="0.10"/>
          <path d="M300 560 A 190 190 0 0 1 490 370" fill="none" stroke="#22D3EE" stroke-width="2" stroke-opacity="0.55"/>
          <line x1="300" y1="370" x2="300" y2="560" stroke="#22D3EE" stroke-width="1.5" stroke-opacity="0.4"/>
          <line x1="300" y1="370" x2="445" y2="438" stroke="#22D3EE" stroke-width="2.5" stroke-opacity="0.85" stroke-linecap="round"/>
          <g fill="#22D3EE">
            <circle cx="387" cy="174" r="5"/>
            <circle cx="72" cy="341" r="5"/>
            <circle cx="185" cy="288" r="5"/>
            <circle cx="131" cy="164" r="5"/>
            <circle cx="406" cy="618" r="5"/>
            <circle cx="104" cy="492" r="5"/>
            <circle cx="76" cy="90" r="5"/>
            <circle cx="107" cy="283" r="5"/>
            <circle cx="179" cy="577" r="5"/>
            <circle cx="368" cy="87" r="5"/>
            <circle cx="347" cy="263" r="5"/>
            <circle cx="426" cy="618" r="5"/>
            <circle cx="274" cy="285" r="5"/>
            <circle cx="289" cy="344" r="5"/>
          </g>
          <circle cx="387" cy="174" r="9" fill="none" stroke="#22D3EE" stroke-opacity="0.5" stroke-width="1.5"/>
          <circle cx="104" cy="492" r="9" fill="none" stroke="#22D3EE" stroke-opacity="0.5" stroke-width="1.5"/>
          <circle cx="368" cy="87" r="9" fill="none" stroke="#22D3EE" stroke-opacity="0.5" stroke-width="1.5"/>
        </svg>
        <div class="auth-visual-content">
          <div class="auth-logo">
            <div class="logo-mark">SF</div>
            <span class="logo-text">Scanforge</span>
          </div>
          <p class="auth-visual-tagline">Escanea, mide y optimiza el rendimiento de tus códigos QR.</p>
        </div>
      </aside>
      <main class="auth-form-side">
        <div class="auth-form-wrap">
          <div class="auth-logo auth-logo-mobile">
            <div class="logo-mark">SF</div>
            <span class="logo-text">Scanforge</span>
          </div>
          <router-outlet />
        </div>
      </main>
    </div>
    <app-toast-container />
  `,
})
export class AuthLayoutComponent {}
