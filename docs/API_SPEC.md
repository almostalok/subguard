# SubGuard — REST API Specification (`/api/v1`)

All endpoints are versioned under `/api/v1/`. Requests and responses use `application/json` unless handling `multipart/form-data` uploads. Authentication uses the `subguard_session` HttpOnly cookie.

---

## 1. Authentication & Session (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Creates a new user account, starts an authenticated session, and returns the user object.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "Rohan Sharma",
    "currency": "INR",
    "timezone": "Asia/Kolkata"
  }
  ```
- **Response 201 Created:**
  ```json
  {
    "user": {
      "id": "c1f7b789-...",
      "email": "user@example.com",
      "name": "Rohan Sharma",
      "currency": "INR",
      "timezone": "Asia/Kolkata",
      "onboardingCompleted": false
    }
  }
  ```
- **Set-Cookie:** `subguard_session=<token>; HttpOnly; Path=/; SameSite=Lax`

### `POST /api/v1/auth/login`
Authenticates existing credentials and sets the session cookie.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response 200 OK:** User profile object.

### `POST /api/v1/auth/logout`
Revokes the current server session and clears the cookie.
- **Response 200 OK:** `{ "success": true }`

### `GET /api/v1/auth/session`
Returns current authenticated user or 401 if unauthenticated.

---

## 2. User & Preferences (`/api/v1/user`)

### `GET /api/v1/user/profile`
Returns user details, active currency, timezone, and onboarding state.

### `PATCH /api/v1/user/profile`
Updates profile settings (currency, timezone, name, onboardingCompleted).

### `GET /api/v1/user/export`
Exports all user data (commitments, mandates, transactions, imports, reminders, notifications) in structured JSON format.

### `DELETE /api/v1/user/account`
Irrevocably deletes the user account and cascades deletion to all associated records.

---

## 3. Subscription & Commitment Vault (`/api/v1/commitments`)

### `GET /api/v1/commitments`
List commitments with query filters:
- Query params: `status`, `category`, `search`, `sortBy`, `sortOrder`, `page`, `limit`
- **Response 200 OK:**
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "name": "Netflix Premium",
        "merchant": "Netflix",
        "category": "ENTERTAINMENT",
        "type": "SUBSCRIPTION",
        "amountMinor": 64900,
        "currency": "INR",
        "cadence": "MONTHLY",
        "nextDueAt": "2026-11-04",
        "status": "ACTIVE",
        "source": "MANUAL_ENTRY",
        "verificationState": "USER_VERIFIED",
        "paymentMethodLabel": "HDFC Infinia **1234",
        "cancellationUrl": "https://netflix.com/youraccount",
        "notes": "4K Ultra HD plan"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
  ```

### `POST /api/v1/commitments`
Create a new commitment.

### `GET /api/v1/commitments/:id`
Get full details of a single commitment, including matched transactions and linked mandates.

### `PATCH /api/v1/commitments/:id`
Update an existing commitment (e.g. pause, change amount, update next due date).

### `DELETE /api/v1/commitments/:id`
Soft-archives or permanently deletes the commitment.

---

## 4. Mandate Register (`/api/v1/mandates`)

### `GET /api/v1/mandates`
List registered mandates (UPI AutoPay, Card e-Mandates, Standing Instructions).

### `POST /api/v1/mandates`
Record a new mandate with provider reference, limit, frequency, and linked commitment.

### `PATCH /api/v1/mandates/:id`
Update status (ACTIVE, PAUSED, REVOKED) or next expected date.

### `DELETE /api/v1/mandates/:id`
Remove mandate record.

---

## 5. Transaction Imports (`/api/v1/imports`)

### `POST /api/v1/imports/preview`
Multipart upload (`file`: CSV). Parses headers and first 10 rows, detects columns (Date, Description, Amount, Debit/Credit).
- **Response 200 OK:**
  ```json
  {
    "detectedMapping": {
      "dateColumn": "Txn Date",
      "descriptionColumn": "Narration",
      "amountColumn": "Debit Amount",
      "typeColumn": null
    },
    "headers": ["Txn Date", "Narration", "Debit Amount", "Credit Amount", "Balance"],
    "previewRows": [...],
    "totalRows": 45,
    "fileHash": "a8f3b..."
  }
  ```

### `POST /api/v1/imports/commit`
Validates all rows according to the specified column mapping, eliminates duplicates, and commits in an atomic transaction.
- **Request Body:**
  ```json
  {
    "filename": "HDFC_Statement_Oct2026.csv",
    "fileHash": "a8f3b...",
    "columnMapping": {
      "dateColumn": "Txn Date",
      "descriptionColumn": "Narration",
      "amountColumn": "Debit Amount",
      "typeColumn": null
    },
    "accountId": "optional-account-uuid",
    "rawCsvText": "..."
  }
  ```
- **Response 201 Created:**
  ```json
  {
    "importId": "uuid",
    "totalRows": 45,
    "validRowCount": 42,
    "duplicateRowCount": 3,
    "invalidRowCount": 0,
    "errors": []
  }
  ```

### `GET /api/v1/imports`
List all import history records with status and counts.

### `DELETE /api/v1/imports/:id`
Rollback an import: deletes the import record and all transactions created by it.

---

## 6. Transactions (`/api/v1/transactions`)

### `GET /api/v1/transactions`
List transactions with pagination, filters by date range, merchant, amount range, and direction.

### `PATCH /api/v1/transactions/:id/exclude`
Toggle `isExcludedFromDetection` flag so irregular one-off charges don't skew detection.

---

## 7. Recurrence Detection & Candidate Review (`/api/v1/detection`)

### `POST /api/v1/detection/run`
Triggers the deterministic recurrence detection engine across all active debit transactions. Returns discovered candidates.

### `GET /api/v1/detection/candidates`
List detected recurrence candidates awaiting review with confidence score and supporting evidence.

### `POST /api/v1/detection/candidates/:id/confirm`
Converts candidate into an active `Commitment`.

### `POST /api/v1/detection/candidates/:id/dismiss`
Dismisses candidate so it is not suggested again.

---

## 8. Deduction Radar & Forecasts (`/api/v1/radar`)

### `GET /api/v1/radar/forecast`
Returns a unified timeline of upcoming debits for a specified date range (default: 30 days):
- Includes confirmed commitments, expected mandate dates, and estimated detected items.
- Every entry labeled with evidence level: `CONFIRMED`, `EXPECTED`, `ESTIMATED`, `POTENTIAL`, `NEEDS_REVIEW`.
- Flags trial expiration dates and missing expected transactions.

---

## 9. Financial Insights (`/api/v1/insights`)

### `GET /api/v1/insights/summary`
Returns exact calculated KPIs:
- `monthlyCommitmentMinor`: Standardized monthly spend.
- `annualCommitmentMinor`: Annualized recurring total.
- `next7DaysMinor`: Total expected in next 7 days.
- `next30DaysMinor`: Total expected in next 30 days.
- `activeCommitmentsCount`: Total active recurring services.
- `pendingReviewCount`: Count of items requiring user action.

### `GET /api/v1/insights/categories`
Spending breakdown grouped by category with percentages and monthly equivalents.

### `GET /api/v1/insights/reconciliation`
Compares expected commitment debits with actual imported transaction debits over the past 30/60/90 days to identify price hikes or missing transactions.

---

## 10. Reminders & Notifications (`/api/v1/reminders`, `/api/v1/notifications`)

### `GET /api/v1/reminders` / `POST /api/v1/reminders` / `PATCH /api/v1/reminders/:id`
Manage advance reminder rules per commitment.

### `GET /api/v1/notifications`
List notifications for the user with read/unread status.

### `PATCH /api/v1/notifications/:id/read`
Mark a single notification as read.

### `POST /api/v1/notifications/read-all`
Mark all notifications as read.
