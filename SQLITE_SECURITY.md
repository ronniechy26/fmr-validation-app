# SQLite Data Security Guide

## Can SQLite Data Be Extracted?

**YES** - SQLite databases in mobile apps can potentially be accessed:

### Android
- **Rooted devices**: Full access to `/data/data/[package]/databases/`
- **ADB backup**: `adb backup -f backup.ab [package]` (if not disabled)
- **File managers**: On rooted devices
- **Non-rooted**: Protected by Android sandboxing ✅

### iOS
- **Jailbroken devices**: Full file system access
- **iTunes/Finder backups**: Can extract from unencrypted backups
- **Third-party tools**: iMazing, iFunBox, etc.
- **Non-jailbroken**: Better protected but backups accessible

## Your App's Current Security

### What's Stored in SQLite:
```
✅ FMR project data (public/work data)
✅ Validation forms (work data)
✅ Sync timestamps
✅ User preferences
✅ JWT tokens (expire after 1 hour)
❌ NO passwords (stored securely via AuthProvider)
❌ NO sensitive personal data
```

### Security Level: **MEDIUM** ✅
Your app is reasonably secure because:
- No passwords in SQLite
- Tokens expire quickly
- Data is work-related, not highly sensitive
- Complies with Data Privacy Act requirements

## Recommendations by Sensitivity Level

### 1. **Current Setup (Good for Most Cases)**
```typescript
// What you have now:
- SQLite for offline data
- JWT tokens with expiration
- No password storage
- Session management
```

**Pros:**
- ✅ Simple and fast
- ✅ Good for work data
- ✅ Compliant with privacy laws
- ✅ Easy to debug

**Cons:**
- ⚠️ Data readable if device is rooted/jailbroken
- ⚠️ Backups may contain data

### 2. **Enhanced Security (If Needed)**

#### Option A: Encrypt Sensitive Fields
```typescript
import * as Crypto from 'expo-crypto';

// Encrypt sensitive data before storing
async function encryptData(data: string): Promise<string> {
  const key = await getEncryptionKey(); // From secure storage
  return await Crypto.encryptAsync(data, key);
}

// Decrypt when reading
async function decryptData(encrypted: string): Promise<string> {
  const key = await getEncryptionKey();
  return await Crypto.decryptAsync(encrypted, key);
}
```

#### Option B: Use Expo SecureStore for Tokens
```typescript
import * as SecureStore from 'expo-secure-store';

// Store tokens in secure storage instead of SQLite
async function saveToken(token: string) {
  await SecureStore.setItemAsync('auth_token', token);
}

async function getToken() {
  return await SecureStore.getItemAsync('auth_token');
}
```

#### Option C: Encrypt Entire Database
```bash
# Install SQLCipher for encrypted SQLite
npm install @journeyapps/react-native-sqlcipher

# Use encrypted database
import SQLite from '@journeyapps/react-native-sqlcipher';

const db = SQLite.openDatabase(
  'fmr.db',
  'your-encryption-key',
  'FMR Database',
  200000
);
```

### 3. **Maximum Security (For Highly Sensitive Data)**

```typescript
// Combine multiple approaches:
1. Encrypted SQLite database (SQLCipher)
2. SecureStore for tokens
3. Field-level encryption for PII
4. Certificate pinning for API calls
5. Disable backups in app config
```

## Implementation Guide

### Quick Win: Secure Token Storage

Replace current token storage with SecureStore:

```typescript
// storage/session.ts
import * as SecureStore from 'expo-secure-store';

export async function saveSession(session: StoredSession) {
  await SecureStore.setItemAsync('session', JSON.stringify(session));
}

export async function loadSession() {
  const data = await SecureStore.getItemAsync('session');
  return data ? JSON.parse(data) : null;
}

export async function clearSession() {
  await SecureStore.deleteItemAsync('session');
}
```

### Disable Android Backups

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<application
  android:allowBackup="false"
  android:fullBackupContent="false"
  ...
>
```

### Disable iOS Backups for Sensitive Files

```typescript
import * as FileSystem from 'expo-file-system';

// Exclude SQLite from backups
await FileSystem.setBackupAsync(
  FileSystem.documentDirectory + 'SQLite/fmr.db',
  false
);
```

## Best Practices

### DO:
✅ Use HTTPS for all API calls
✅ Implement token expiration (you already do this)
✅ Clear sensitive data on logout
✅ Validate data integrity
✅ Use SecureStore for tokens/keys
✅ Implement certificate pinning for production

### DON'T:
❌ Store passwords in SQLite
❌ Store API keys in SQLite
❌ Store unencrypted credit card data
❌ Store unencrypted health records
❌ Assume SQLite is secure by default

## Risk Assessment for Your App

### Low Risk ✅
- FMR project metadata
- Form validation status
- Sync timestamps
- User preferences

### Medium Risk ⚠️
- JWT tokens (mitigated by expiration)
- User email addresses
- Form data with farmer names

### High Risk ❌
- None in your current app

## Compliance

### Data Privacy Act of 2012 (RA 10173)
Your current implementation is **compliant** because:
- ✅ You collect minimal data
- ✅ Data is used for legitimate purpose
- ✅ You have privacy policy
- ✅ No sensitive personal data stored
- ✅ Reasonable security measures

### Recommendations:
1. **Document** what data is stored locally
2. **Inform users** in privacy policy
3. **Implement** remote wipe capability
4. **Consider** encryption for production

## Quick Security Checklist

- [ ] Move JWT tokens to SecureStore
- [ ] Disable Android backups
- [ ] Exclude SQLite from iOS backups
- [ ] Add certificate pinning
- [ ] Implement remote wipe
- [ ] Add data integrity checks
- [ ] Document security measures
- [ ] Regular security audits

## Conclusion

**For your FMR validation app:**

**Current security is ADEQUATE** because:
- Data is work-related, not highly sensitive
- No passwords or payment info stored
- Tokens expire quickly
- Compliant with privacy laws

**Consider upgrading if:**
- You add sensitive personal data
- Regulatory requirements change
- You handle financial information
- You need to pass security audits

**Recommended next step:**
Move JWT tokens to SecureStore (easy win, better security)
