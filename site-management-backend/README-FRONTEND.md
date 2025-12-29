# Frontend Setup Guide - Angular Site Management Application

## Prerequisites

- **Node.js** (v18 or later)
- **npm** or **yarn** package manager
- **Angular CLI** (v17 or later)
- **Git** for version control

## Quick Start

### 1. Install Angular CLI
```bash
npm install -g @angular/cli
```

### 2. Create New Angular Project
```bash
ng new site-management-frontend
cd site-management-frontend
```

### 3. Install Required Dependencies
```bash
# Core dependencies
npm install @angular/material @angular/cdk @angular/animations
npm install @angular/common/http
npm install rxjs

# UI/UX Libraries
npm install @angular/material-moment-adapter moment
npm install chart.js ng2-charts
npm install @angular/flex-layout

# Form handling
npm install @angular/forms

# Authentication & Security
npm install @auth0/angular-jwt

# Date handling
npm install moment

# Optional: State Management
npm install @ngrx/store @ngrx/effects @ngrx/store-devtools
```

### 4. Development Dependencies
```bash
npm install --save-dev @types/node
npm install --save-dev typescript
```

## Backend Integration

### API Configuration
Create `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001',
  jwtTokenKey: 'site_management_token'
};
```

### Authentication Service Setup
The backend provides JWT authentication at:
- **Login**: `POST /auth/login`
- **Protected Routes**: Include `Authorization: Bearer <token>` header

### Available API Endpoints

#### Labor Management
- `GET /for-labor` - Get all labor records
- `POST /for-labor` - Create labor record
- `POST /for-labor/from-attendance` - Create from attendance data
- `GET /for-labor/analytics/payment-types` - Payment type analytics
- `GET /for-labor/analytics/employee/{id}/ytd` - YTD employee summary

#### Material Management
- `GET /for-material` - Get all material records
- `POST /for-material` - Create material record
- `GET /for-material/supplier/performance` - Supplier performance analytics

#### Authentication
- `POST /auth/login` - User login (returns JWT token)

## Recommended Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── api.service.ts
│   │   │   └── interceptors/
│   │   └── guards/
│   ├── shared/
│   │   ├── components/
│   │   ├── pipes/
│   │   └── models/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── labor-management/
│   │   ├── material-management/
│   │   └── analytics/
│   └── layout/
├── assets/
└── environments/
```

## Key Angular Modules to Include

### app.module.ts
```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Material Design
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    // Material modules...
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Authentication Implementation

### JWT Interceptor
```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('site_management_token');
    
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authReq);
    }
    
    return next.handle(req);
  }
}
```

## Sample Service Implementation

### Labor Service
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LaborService {
  private apiUrl = `${environment.apiUrl}/for-labor`;

  constructor(private http: HttpClient) {}

  getLaborRecords(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createFromAttendance(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/from-attendance`, data);
  }

  getPaymentAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/payment-types`);
  }

  getEmployeeYTD(employeeId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/employee/${employeeId}/ytd`);
  }
}
```

## UI Component Examples

### Dashboard Features to Implement
1. **Labor Cost Overview** - Charts and summaries
2. **Material Cost Tracking** - Supplier performance
3. **Employee Analytics** - YTD summaries, overtime tracking
4. **Progressive Overtime Calculator** - Real-time cost preview
5. **Attendance Integration** - Clock in/out with automatic cost calculation

### Recommended Charts/Visualizations
- Payment type distribution (Pie chart)
- Monthly cost trends (Line chart)
- Supplier performance comparison (Bar chart)
- Employee productivity metrics (Dashboard cards)

## Development Commands

```bash
# Start development server
ng serve

# Build for production
ng build --prod

# Run tests
ng test

# Generate components
ng generate component features/dashboard
ng generate service core/services/labor
ng generate guard core/guards/auth
```

## Backend Server Requirements

Ensure the backend server is running:
```bash
cd site-management-backend
npm run start:dev
```

Backend should be accessible at `http://localhost:3001`

## Authentication Flow

1. **Login**: POST credentials to `/auth/login`
2. **Store JWT**: Save token in localStorage
3. **Include Token**: Add to Authorization header for all API calls
4. **Handle Expiry**: Redirect to login on 401 responses

## Sample Environment Variables

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001',
  jwtTokenKey: 'site_management_token',
  features: {
    progressiveOvertime: true,
    attendanceIntegration: true,
    analyticsModule: true
  }
};
```

## Next Steps

1. **Setup Angular project** with above configuration
2. **Implement authentication** module first
3. **Create dashboard** with basic labor/material overview
4. **Build labor management** features with attendance integration
5. **Add material tracking** and supplier performance
6. **Implement analytics** dashboards with charts
7. **Test progressive overtime** calculations

## Support

- Backend API is fully functional and tested
- JWT authentication implemented and working
- Progressive overtime calculations ready
- Comprehensive analytics endpoints available
- Real-time cost calculations integrated

The backend provides robust APIs for all site management features including advanced wage calculations, attendance integration, and comprehensive analytics.