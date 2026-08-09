# NeuroSys Production Security Checklist

The following security controls must be verified prior to deploying **NeuroSys** to production networks.

---

## 🔒 Security Baseline Audit Checklist

### 1. Authentication & Authorization
- [x] **BCrypt Password Encryption**: All user passwords hashed using BCrypt with strength 12 work factor.
- [x] **Stateless JWT Tokens**: Short-lived Access Tokens (15 mins) signed via HMAC-SHA512 (`HS512`).
- [x] **Refresh Token Rotation**: Refresh tokens persisted in MySQL, bound to user devices/IPs, with revocation support upon logout.
- [x] **Role-Based Access Control (RBAC)**: Enforced via Spring Security `@PreAuthorize("hasRole('ADMIN')")`.

### 2. Transport & Network Security
- [x] **TLS 1.3 / HTTPS**: Enforced across Nginx proxy for all web traffic and API endpoints.
- [x] **Secure WebSocket (WSS)**: STOMP over SockJS encrypted over TLS.
- [x] **CORS Hardening**: Cross-Origin Resource Sharing strictly limited to verified frontend domain origin.

### 3. Database Security
- [x] **Least Privilege Access**: Dedicated MySQL database user (`neurosys_user`) isolated to `neurosys_db`.
- [x] **SQL Injection Protection**: Prepared statements and Spring Data JPA parameterization across all query paths.
- [x] **Auditing & Soft Delete**: Full tracking of `created_at`, `updated_at`, `created_by`, `updated_by`, and soft-deletion (`deleted = false`).

### 4. Application Security & Input Validation
- [x] **Jakarta Payload Validation**: `@Valid`, `@NotNull`, `@Size`, `@Min`, `@Max` applied on all REST DTO inputs.
- [x] **Global Exception Handling**: Centralized `GlobalExceptionHandler` masking internal stack traces from public API responses.
- [x] **Agent Authentication Token**: Dedicated authorization headers verifying agent identity before accepting metric telemetry.
