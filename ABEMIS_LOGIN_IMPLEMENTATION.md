# ABEMIS Login Integration

## Overview
Integrated ABEMIS authentication API into the FMR Validation app with fallback to local users for testing.

## Changes Made

### Backend (`fmr-validation-services`)

#### 1. Updated `auth.service.ts`
- Changed `LoginDto` from `email` to `username`
- Added ABEMIS API integration via `authenticateWithAbemis()` method
- Implemented role-based access control:
  - **"BAFE - Central Office"** → `Administrator` role (can see all regions)
  - **Other regions** → `Regional User` role (can only see own region)
- Added fallback to local hardcoded users for testing
- Added comprehensive logging for debugging

#### 2. Authentication Flow
```
1. User submits username + password
2. Backend tries ABEMIS API first: POST {{ABEMIS_BASE_URL}}/api/login
3. If ABEMIS succeeds → Map user data + issue JWT tokens
4. If ABEMIS fails → Fallback to local users (for testing)
5. Return JWT tokens + user session data
```

#### 3. ABEMIS Response Mapping
```typescript
ABEMIS Response:
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "mis_support@bafe.da.gov.ph",
    "fullname": "BAFE - PKMDD",
    "region": "BAFE - Central Office"
  }
}

Mapped to SessionUser:
{
  id: "abemis-1",
  name: "BAFE - PKMDD",
  email: "mis_support@bafe.da.gov.ph",
  role: "Administrator",  // or "Regional User"
  region: "BAFE - Central Office"
}
```

### Frontend (`fmr-validation-app`)

#### 1. Updated `LoginScreen.tsx`
- Changed input field from "Email Address" to "Username"
- Updated placeholder text
- Changed keyboard type from `email-address` to default
- Updated validation messages

#### 2. Updated `types/auth.ts`
- Changed `LoginPayload.email` to `LoginPayload.username`

## Testing

### Test with ABEMIS (Production)
```
Username: <your ABEMIS username>
Password: <your ABEMIS password>
```

### Test with Local Users (Fallback)
```
Username: mark.baldeo@da.gov.ph
Password: validation123

OR

Username: alyssa.cruz@da.gov.ph
Password: securepass456
```

## Configuration

### Backend `.env`
```env
ABEMIS_BASE_URL=https://abemis.staging.bafe.gov.ph
# or production URL
```

## Role-Based Access Control

- **Administrator** (BAFE - Central Office)
  - Can view all regions
  - Full access to all projects and forms

- **Regional User** (All other regions)
  - Can only view their own region
  - Limited to regional projects and forms

## Logging

Backend logs will show:
```
[AuthService] User authenticated via ABEMIS: user@example.com
[AuthService] ABEMIS authentication failed: <error>. Falling back to local users.
[AuthService] User authenticated via local database: user@example.com
```

## Security Notes

- ABEMIS API is called server-side only (credentials never exposed to client)
- JWT tokens are issued after successful ABEMIS authentication
- Local users are only for testing/development
- No password hashing for local users (development only)
