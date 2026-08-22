# Meridian auth email templates

Branded HTML for Supabase's built-in auth emails, matching the app's palette
and the Meridian logoset (dark navy `#0a141c` / lime accent `#d8ff4b`,
Encode Sans Expanded wordmark, JetBrains Mono / Inter Tight body).

Supabase renders these server-side (Go `html/template`), so they live here
as plain files, not in the app itself — there's no API to push them, so
copy-paste each into the dashboard by hand:

**Authentication → Emails → Templates** in your Supabase project, one
template per file below. Each file's first line is an HTML comment with
the suggested subject line for that template's "Subject heading" field.

| File | Supabase template | Suggested subject |
|---|---|---|
| `confirm-signup.html` | Confirm signup | Confirm your Meridian account |
| `magic-link.html` | Magic Link | Your Meridian sign-in link |
| `reset-password.html` | Reset Password | Reset your Meridian password |
| `change-email.html` | Change Email Address | Confirm your new email for Meridian |
| `invite-user.html` | Invite user | You've been invited to Meridian |

All five keep the same `{{ .ConfirmationURL }}` button pattern Supabase's
defaults use — copy the file's full contents into the template body field
as-is.

If you add a lesson/UI change that touches the brand palette or wordmark
(`app/globals.css`, `components/NavBar.tsx`), update these to match —
they're not wired into any build step, so nothing enforces that.
