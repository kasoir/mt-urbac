import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
      <div class="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
        <i class="pi pi-exclamation-triangle text-5xl"></i>
      </div>
      <h1 class="text-4xl font-extrabold text-gray-900 mb-2">404 - Not Found</h1>
      <p class="text-gray-500 max-w-md mb-8">
        The workspace or page you are looking for does not exist. Please check the URL or return to the main portal.
      </p>
      <a
        routerLink="/admin/login"
        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
      >
        Go to Admin Portal
      </a>
    </div>
  `
})
export class NotFoundComponent {}
