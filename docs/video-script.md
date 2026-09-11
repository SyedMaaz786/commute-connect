# Video walkthrough — shot list

A 2–3 minute screen recording of you narrating the app, per the assignment's bonus ask. Record this
yourself (OBS, Loom, Windows' built-in Xbox Game Bar capture, whatever) — it's meant to be you talking
through your own project, not a scripted performance. Use this as a checklist of beats to hit, not a
word-for-word script.

## Setup before recording

- Have the live Vercel URL open (or `ng serve` + `npm run start:dev` running locally if you're
  demoing before deploying).
- Have two browser windows/profiles ready (or one regular + one incognito) so you can show two
  different users interacting with the same post without re-logging-in on camera.
- Close anything else on screen that might leak personal info (open tabs, notifications).

## Beats (roughly 15–25 seconds each)

1. **Intro (10s)** — "This is CommuteConnect, a carpool coordinator built with Angular, NestJS,
   PostgreSQL, and JWT auth." One sentence on what it does.
2. **Register / login** — show the form validation firing on an empty/invalid submit (real messages,
   not just red borders), then a successful signup.
3. **Browse + filter posts** — show the list, type a partial origin/destination into the filter bar,
   show it narrowing the results live.
4. **Create a post** — fill the form (origin, destination, date/time, seats, notes), submit, land on
   the detail page.
5. **Switch to the second user** — log in as someone else, open that same post, click "I'm interested."
6. **Back to the first user (owner)** — refresh the post detail page, show the interested rider now
   listed. This is the core "matching" feature — give it a beat to land.
7. **Dashboard** — My Posts and My Interests, showing each user sees their own slice correctly.
8. **Resize the window down to phone width** (or open on an actual phone) — show the nav collapsing
   into the hamburger menu and the layout reflowing. Fifteen seconds is enough.
9. **One technical decision you're proud of (30–45s)** — pick ONE and actually explain the trade-off,
   not just what it does. Good candidates already in this codebase:
   - Signals + plain services for state instead of NgRx — less ceremony for an app this size, and
     it's the direction Angular itself is pushing.
   - Hand-rolled UUID generation (`@BeforeInsert` + `crypto.randomUUID()`) instead of a DB-generated
     default, specifically to avoid depending on a Postgres extension across different managed
     hosting providers.
   - The interceptor split: `authInterceptor` just attaches the token; `errorInterceptor` only
     handles the one cross-cutting case (session expiry) and lets every component own its own
     loading/error/empty state instead of a global error banner swallowing everything.
   - Whatever you actually spent the most time getting right — that's usually the most convincing one
     to talk about, because you can defend it in follow-up questions.
10. **Close (5–10s)** — mention the repo/live URLs are in the README, done.

## What NOT to do

- Don't fake mistakes or hesitation to "look human" — there's nothing to hide. The assignment
  explicitly says AI-assisted tooling is fine; what matters is that you understand and can defend
  every decision, which this script is designed to make easy to demonstrate honestly.
- Don't read this script verbatim on camera — talk through it in your own words. You built this and
  know it better than any script could capture.
