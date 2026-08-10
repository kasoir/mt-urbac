import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';
import { tenantHeaderInterceptor } from './core/interceptors/tenant-header.interceptor';
import { TenantConfigService } from './core/services/tenant-config.service';
import { provideOptimus } from '@openng/optimus-ui/config';
import Lara from '@openng/optimus-ui-themes/lara';
import { definePreset } from '@openng/optimus-ui-themes';

import { lastValueFrom } from 'rxjs';

export function initializeApp(authService: AuthService, tenantService: TenantConfigService) {
  return async () => {
    await tenantService.init();
    await lastValueFrom(authService.restoreSession());
  };
}

const BluePreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}'
    },
    colorScheme: {
        light: {
            primary: {
                color: '{blue.500}',
                inverseColor: '#ffffff',
                hoverColor: '{blue.600}',
                activeColor: '{blue.700}'
            },
            highlight: {
                background: '{blue.50}',
                focusBackground: '{blue.100}',
                color: '{blue.700}',
                focusColor: '{blue.800}'
            }
        },
        dark: {
            surface: {
                0: '#ffffff',
                50: '{slate.50}',
                100: '{slate.100}',
                200: '{slate.200}',
                300: '{slate.300}',
                400: '{slate.400}',
                500: '{slate.500}',
                600: '{slate.600}',
                700: '{slate.700}',
                800: '{slate.800}',
                900: '{slate.900}',
                950: '{slate.950}'
            },
            primary: {
                color: '{blue.500}',
                inverseColor: '#ffffff',
                hoverColor: '{blue.600}',
                activeColor: '{blue.700}'
            },
            highlight: {
                background: '{blue.50}',
                focusBackground: '{blue.100}',
                color: '{blue.700}',
                focusColor: '{blue.800}'
            }
        }
    }
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, tenantHeaderInterceptor])),
    provideOptimus({
      theme: {
        preset: BluePreset,
        options: {
          darkModeSelector: 'none',
          cssLayer: {
              name: 'primeng',
              options: { prepend: true }
          }
        }
      }
    }),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService, TenantConfigService],
      multi: true
    }
  ]
};
