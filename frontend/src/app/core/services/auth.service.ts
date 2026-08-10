import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, catchError } from 'rxjs';
import { AuthResponse, LoginDto, SignupDto, SignupStatusResponse, User } from '../models/mt-urbac.models';
import { ContextService } from './context.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000';
  private readonly TOKEN_KEY = 'mt_urbac_auth_token';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  public currentUserSignal = signal<User | null>(null);

  constructor(
    private http: HttpClient,
    private contextService: ContextService,
    private router: Router
  ) {}

  /**
   * Log in user with credentials
   */
  public login(payload: LoginDto): Observable<AuthResponse> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, payload).pipe(
      tap((res) => {
        const token = (res.accessToken || res.access_token || '') as string;
        this.handleAuthSuccess(token, res.user);
      })
    );
  }

  /**
   * Register new user account
   */
  public signup(payload: SignupDto): Observable<AuthResponse> {
    return this.http.post<any>(`${this.apiUrl}/auth/signup`, payload).pipe(
      tap((res) => {
        const token = (res.accessToken || res.access_token || '') as string;
        this.handleAuthSuccess(token, res.user);
      })
    );
  }

  /**
   * Check if public signup is enabled on backend
   */
  public checkPublicSignupAllowed(): Observable<SignupStatusResponse> {
    return this.http.get<SignupStatusResponse>(`${this.apiUrl}/auth/signup-allowed`).pipe(
      catchError(() => of({ allowed: true, message: 'Public signup available' }))
    );
  }

  /**
   * Fetch current authenticated user profile from backend
   */
  public fetchProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
        this.currentUserSignal.set(user);
        this.contextService.setContext(user);
      })
    );
  }

  /**
   * Restore logged in session if JWT exists in storage
   */
  public restoreSession(): Observable<User | null> {
    const token = this.getToken();
    if (!token) {
      this.clearSession();
      return of(null);
    }
    return this.fetchProfile().pipe(
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  /**
   * Log out user and clear storage and context
   */
  public logout(): void {
    this.clearSession();
    
    let loginPath = '/login';
    const currentUrl = window.location.pathname;
    if (currentUrl.startsWith('/admin')) {
      loginPath = '/admin/login';
    } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const segments = currentUrl.split('?')[0].split('/').filter(s => s.length > 0);
      if (segments.length > 0 && segments[0] !== 'admin') {
        loginPath = `/${segments[0]}/login`;
      }
    }
    
    this.router.navigate([loginPath]);
  }

  /**
   * Get stored JWT token
   */
  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get current user object synchronously
   */
  public getCurrentUser(): User | null {
    return this.currentUserSignal();
  }

  /**
   * Check if user is logged in
   */
  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private handleAuthSuccess(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.currentUserSubject.next(user);
    this.currentUserSignal.set(user);
    this.contextService.setContext(user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.currentUserSignal.set(null);
    this.contextService.clearContext();
  }
}
