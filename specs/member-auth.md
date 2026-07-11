# Member Authentication — Future Implementation Plan

**Status:** Planned, not implemented.
**Current state (as of July 2026):** member-facing flows are protected by document ID + Turnstile. Read endpoints that return personal data (`/api/members/search`, `/api/children/search`, `/api/volunteer-events/[id]/check-registration`) require a Turnstile token or a short-lived signed `form_pass` cookie (see `src/lib/turnstile.ts`). Admin routes are protected by Cloudflare Access.

## Problem

Today the document ID (cédula) works as both identifier _and_ credential. Anyone who knows a member's cédula can:

- Read their profile via the member endpoints (mitigated by Turnstile, but Turnstile stops bots, not humans).
- **Update their data** via `PUT /api/member` — there is no proof that the requester owns the document.

This is acceptable while the platform is low-profile, but it is not real authentication. The goal is that a church member can view and update their own data (and their children's data, enrollments, registrations) whenever they want, with confidence that only they can do it.

## Proposed design: OTP to the registered phone + session cookie

No passwords. The phone number is already a required field on `Member`, so it is the natural second factor in Colombia — and WhatsApp is the channel members already use (the platform already links WhatsApp groups for courses and volunteer events).

### Flow

1. Member opens "Mis datos", enters their cédula (+ Turnstile).
2. `POST /api/auth/request-code`:
   - Generates a 6-digit code with `crypto.getRandomValues()`.
   - Stores a hash of the code in D1 (`AuthCode` table: `documentID`, `codeHash`, `expiresAt` = 10 min, `attempts` max 3).
   - Sends the code to the phone on file. UI shows only the masked phone ("enviamos un código al **\*-**45").
3. `POST /api/auth/verify`:
   - Checks the code hash, expiry, and attempt count.
   - On success issues an HMAC-signed session token (Web Crypto, secret via `wrangler secret put SESSION_SECRET`) in an `httpOnly` + `Secure` + `SameSite=Strict` cookie, valid ~30 days. Stateless — no session table needed.
4. "My account" endpoints (profile read/update, my children, my enrollments) read the cookie. The `memberId` comes **from the token, never from the request body** — this kills the whole "cédula as password" bug class.

### Delivery channel

| Channel                                                               | Cost                                                              | Coverage                                  | Notes                                                                                                |
| --------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **WhatsApp (Meta Cloud API)**                                         | Cents per auth template message; a few USD/month at church volume | Phone is required on `Member`, so ~100%   | Requires registering the church's number in Meta Business (the tedious part, ~1 day). **Preferred.** |
| Email (Cloudflare Email Service)                                      | Free                                                              | Partial — `email` is optional on `Member` | Good fallback only                                                                                   |
| Knowledge-based bridge (cédula + birth date + last 4 digits of phone) | Free                                                              | 100%                                      | Weak, but better than cédula alone; same session infra, swap step 2 later                            |

**Recommendation:** build the session infrastructure (steps 3–4) with the knowledge-based bridge first if OTP delivery isn't ready, then swap in WhatsApp OTP. The WhatsApp Business API registration is worth doing regardless: the church also wants **direct member contact** in the future (reminders, announcements, enrollment confirmations), which uses the same Meta Cloud API setup and number.

### Scope notes

- Visitor-facing forms (friend request, course enrollment, volunteer registration) **stay Turnstile-only** — no account required, login would kill conversion.
- The existing `form_pass` cookie mechanism in `src/lib/turnstile.ts` is a good template for the session token implementation (HMAC signing via Web Crypto, cookie attributes).
- Rate-limit `/api/auth/request-code` (per document ID and per IP) to prevent OTP spam — Cloudflare rate limiting rules or a D1 counter.
- Once sessions exist, `/api/members/search` and `PUT /api/member` should migrate to session auth; the Turnstile-protected lookup endpoints can then be restricted or removed.

### Out of scope

- Passwords, OAuth/social login (unnecessary complexity for this audience).
- Admin auth (already covered by Cloudflare Access).
