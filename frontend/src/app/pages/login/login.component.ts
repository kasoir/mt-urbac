import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

// @openng/optimus-ui Imports
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { PasswordModule } from '@openng/optimus-ui/password';
import { ButtonModule } from '@openng/optimus-ui/button';
import { ToastModule } from '@openng/optimus-ui/toast';
import { MessageService } from '@openng/optimus-ui/api';

@Component({
    selector: 'app-login',
    imports: [
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule
],
    providers: [MessageService],
    template: `
    <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-50">
      <p-toast></p-toast>
    
      <div class="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl relative z-10 border border-gray-200">
        <!-- Logo & Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-sm border border-blue-100">
            <i class="pi pi-shield text-3xl"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">MT-URBAC Portal</h1>
          <p class="text-gray-500 text-sm mt-1">Unified User & Role-Based Access Control</p>
        </div>
    
        <!-- Login Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">Email Address</label>
            <div class="p-input-icon-left w-full">
              <i class="pi pi-envelope text-gray-400"></i>
              <input
                type="email"
                pInputText
                formControlName="email"
                placeholder="Enter your email"
                class="w-full !bg-white !border-gray-300 !text-gray-900 placeholder:!text-gray-400 focus:!border-blue-500 focus:!ring-1 focus:!ring-blue-500 rounded-lg py-3 pl-10"
                />
            </div>
            @if (isFieldInvalid('email')) {
              <div class="text-red-500 text-xs mt-1">
                Please enter a valid email address
              </div>
            }
          </div>
    
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">Password</label>
            <div class="w-full">
              <p-password
                formControlName="password"
                [feedback]="false"
                [toggleMask]="true"
                placeholder="Enter password"
                styleClass="w-full"
                inputStyleClass="w-full !bg-white !border-gray-300 !text-gray-900 placeholder:!text-gray-400 focus:!border-blue-500 focus:!ring-1 focus:!ring-blue-500 rounded-lg py-3"
              ></p-password>
            </div>
            @if (isFieldInvalid('password')) {
              <div class="text-red-500 text-xs mt-1">
                Password is required
              </div>
            }
          </div>
    
          <button
            type="submit"
            [disabled]="loginForm.invalid || isLoading"
            class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-6"
            >
            @if (isLoading) {
              <i class="pi pi-spin pi-spinner text-lg"></i>
            }
            <span>{{ isLoading ? 'Authenticating...' : 'Sign In' }}</span>
          </button>
        </form>
    
        <!-- Footer link -->
        @if (!isAdminRoute) {
          <div class="mt-8 text-center text-sm text-gray-500 border-t border-gray-100 pt-6">
            Need an account?
            <a routerLink="../signup" class="text-blue-600 font-semibold hover:text-blue-500 transition-colors underline underline-offset-4">
              Register Here
            </a>
          </div>
        }
      </div>
    </div>
    `
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  isAdminRoute = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.isAdminRoute = window.location.pathname.startsWith('/admin');
    
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['../'], { relativeTo: this.route });
      return;
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Welcome Back',
          detail: 'Successfully authenticated.'
        });
        setTimeout(() => this.router.navigate(['../'], { relativeTo: this.route }), 500);
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Authentication Failed',
          detail: err?.error?.message || 'Invalid username or password'
        });
      }
    });
  }
}
