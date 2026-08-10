import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

// @openng/optimus-ui Imports
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { PasswordModule } from '@openng/optimus-ui/password';
import { ButtonModule } from '@openng/optimus-ui/button';
import { ToastModule } from '@openng/optimus-ui/toast';
import { MessageModule } from '@openng/optimus-ui/message';
import { MessageService } from '@openng/optimus-ui/api';

@Component({
    selector: 'app-signup',
    imports: [
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
    MessageModule
],
    providers: [MessageService],
    template: `
    <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-50">
      <p-toast></p-toast>
    
      <div class="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl relative z-10 border border-gray-200">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-sm border border-blue-100">
            <i class="pi pi-user-plus text-3xl"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Create Account</h1>
          <p class="text-gray-500 text-sm mt-1">Register your MT-URBAC portal credentials</p>
        </div>
    
        <!-- Disabled Signup Banner -->
        @if (!isSignupAllowed && !isCheckingSignup) {
          <div class="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-sm flex flex-col items-center text-center gap-2">
            <i class="pi pi-exclamation-triangle text-2xl text-orange-500"></i>
            <p class="font-semibold text-base">Public Signup Disabled</p>
            <p class="text-xs text-orange-700">
              Public registration is currently disabled by system administrators. Please contact your security team to obtain access credentials.
            </p>
            <a routerLink="../login" class="mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors">
              Return to Sign In
            </a>
          </div>
        }
    
        <!-- Loading State for Signup Check -->
        @if (isCheckingSignup) {
          <div class="flex flex-col items-center justify-center py-8 gap-3">
            <i class="pi pi-spin pi-spinner text-3xl text-blue-600"></i>
            <span class="text-gray-500 text-sm">Verifying registration policies...</span>
          </div>
        }
    
        <!-- Active Registration Form -->
        @if (isSignupAllowed && !isCheckingSignup) {
          <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">Username</label>
              <div class="p-input-icon-left w-full">
                <i class="pi pi-user text-gray-400"></i>
                <input
                  type="text"
                  pInputText
                  formControlName="username"
                  placeholder="Choose a username"
                  class="w-full !bg-white !border-gray-300 !text-gray-900 placeholder:!text-gray-400 focus:!border-blue-500 focus:!ring-1 focus:!ring-blue-500 rounded-lg py-3 pl-10"
                  />
              </div>
              @if (isFieldInvalid('username')) {
                <div class="text-red-500 text-xs mt-1">
                  Username is required (min 3 characters)
                </div>
              }
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">Email Address</label>
              <div class="p-input-icon-left w-full">
                <i class="pi pi-envelope text-gray-400"></i>
                <input
                  type="email"
                  pInputText
                  formControlName="email"
                  placeholder="you@company.com"
                  class="w-full !bg-white !border-gray-300 !text-gray-900 placeholder:!text-gray-400 focus:!border-blue-500 focus:!ring-1 focus:!ring-blue-500 rounded-lg py-3 pl-10"
                  />
              </div>
              @if (isFieldInvalid('email')) {
                <div class="text-red-500 text-xs mt-1">
                  Valid email is required
                </div>
              }
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">Password</label>
              <p-password
                formControlName="password"
                [toggleMask]="true"
                placeholder="Min 6 characters"
                styleClass="w-full"
                inputStyleClass="w-full !bg-white !border-gray-300 !text-gray-900 placeholder:!text-gray-400 focus:!border-blue-500 focus:!ring-1 focus:!ring-blue-500 rounded-lg py-3"
              ></p-password>
              @if (isFieldInvalid('password')) {
                <div class="text-red-500 text-xs mt-1">
                  Password must be at least 6 characters
                </div>
              }
            </div>
            <button
              type="submit"
              [disabled]="signupForm.invalid || isLoading"
              class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-6"
              >
              @if (isLoading) {
                <i class="pi pi-spin pi-spinner text-lg"></i>
              }
              <span>{{ isLoading ? 'Creating Account...' : 'Register' }}</span>
            </button>
          </form>
        }
    
        <div class="mt-8 text-center text-sm text-gray-500 border-t border-gray-100 pt-6">
          Already registered?
          <a routerLink="../login" class="text-blue-600 font-semibold hover:text-blue-500 transition-colors underline underline-offset-4">
            Sign In Here
          </a>
        </div>
      </div>
    </div>
    `
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  isLoading = false;
  isCheckingSignup = true;
  isSignupAllowed = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    if (window.location.pathname.startsWith('/admin')) {
      this.router.navigate(['/admin/login']);
      return;
    }

    if (this.authService.isAuthenticated()) {
      this.router.navigate(['../'], { relativeTo: this.route });
      return;
    }

    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.checkPolicy();
  }

  checkPolicy(): void {
    this.isCheckingSignup = true;
    this.authService.checkPublicSignupAllowed().subscribe({
      next: (res) => {
        this.isCheckingSignup = false;
        this.isSignupAllowed = res.allowed;
      },
      error: () => {
        this.isCheckingSignup = false;
        this.isSignupAllowed = true;
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.signupForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.authService.signup(this.signupForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Account Created',
          detail: 'Welcome! Account successfully registered.'
        });
        setTimeout(() => this.router.navigate(['../'], { relativeTo: this.route }), 500);
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Registration Failed',
          detail: err?.error?.message || 'Failed to create account.'
        });
      }
    });
  }
}
