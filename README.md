# 💗 Will you be my girlfriend?

A self-contained, single-page romantic proposal site: floating hearts, animated "Cupid" AI
assistant, story section, three answer buttons, and email notifications for every answer.

Everything lives in **one file**: `index.html` (inline CSS + JavaScript). No build step.

---

## 1. Put your details in the code

Open `index.html` and find the big marked block near the bottom of the file:

```
✏️✏️✏️  STEP 1 — YOUR DETAILS  ✏️✏️✏️
```

**Already filled in for you:** your email address and the three EmailJS keys
(`publicKey`, `serviceId`, `templateId`) — double-check them in `CONFIG`.

**Still to edit:**

| Placeholder | What it is |
|---|---|
| `REPLACE_WITH_HER_NAME` | Her name, used in the emails (optional) |

You'll also edit:

- **Story text** — the three `✏️ EDIT THIS TEXT` paragraphs in the Story section, plus the final
  message she unlocks on the YES screen.
- **Photos** — `CONFIG.images.firstSight`, `.firstTalk`, `.feelings` (step 4).

> 🔒 **Secrets:** the OpenRouter AI key is deliberately **not** in `index.html`. It lives only in
> Vercel's environment variables (and the gitignored `.env.local`), so it can never leak from the
> page and can never be committed to GitHub.

---

## 2. EmailJS (free) — how the site emails you

Your keys are already in `CONFIG.emailjs`. What you still need is the **template** itself:

1. Go to <https://dashboard.emailjs.com> (account already created).
2. **Email Templates** → open template `template_zat42tb` (or create a new one) and set:
   - **To Email:** `{{to_email}}`
   - **Subject:** `{{subject}}`
   - **Content:** `{{message}}` (decorate it however you like)
   - Save.
3. In **Account → Security**, leave **“Block API access from non-browser environments” ON**.
   That's a good thing: it stops scripts from abusing your keys, while the website (a real
   browser) keeps working.

Three emails get sent:

| She clicks | Subject |
|---|---|
| `YES ❤️` | `She said YES!` |
| `No` | `She said NO 💔 — here's her reason` (includes her typed reason) |
| `Want some time ⏳` | `She wants some time ⏳ — ask again on <her chosen date>` |

> Free tier covers a personal project easily — check EmailJS's current limits on their pricing page.

---

## 3. The AI agent — how it works (key stays private)

The Cupid chat talks to **`api/chat.js`**, a tiny serverless function on Vercel. The OpenRouter
key (`nvidia/nemotron-3-super-120b-a12b:free` — free tier) is read from an environment variable
**on the server** and never reaches the browser or Git.

**One-time setup after your first deploy:**

1. Vercel → your project → **Settings → Environment Variables**
2. Add `OPENROUTER_API_KEY` = your key → Save
3. Redeploy (Deployments → ⋯ → Redeploy) so the variable takes effect

**Local development:** the key is in the gitignored `.env.local`; run `vercel dev` and it works.
Opening `index.html` directly (double-click) has no server, so the chat uses the **built-in
rule-based replies** (~13 categories of sweet canned responses, no cost).

> If the endpoint ever fails — no env var, quota hit, outage — Cupid silently falls back to the
> rule-based replies, so the chat **never breaks** in front of her.

---

## 4. Photos for "Our Journey"

The three chapter photos are already in the project, in **`img/`**:

| Slot | File | Shown in |
|---|---|---|
| `CONFIG.images.firstSight` | `img/chapter-1.jpg` | Chapter 1 |
| `CONFIG.images.firstTalk` | `img/chapter-2.jpg` | Chapter 2 |
| `CONFIG.images.feelings` | `img/chapter-3.jpg` | Chapter 3 |

**To swap a photo:** replace the file in `img/` (same name) — no code change needed.

You can also host photos elsewhere and paste **direct image links** (they should end in
`.jpg`, `.png`, `.gif`…) into `CONFIG.images` instead of the file paths:

- **Imgur:** upload → right-click the image → *Copy image address* → paste into `CONFIG.images`.
- **Google Drive:** share the photo as *“Anyone with the link”*, then use
  `https://lh3.googleusercontent.com/d/FILE_ID` where `FILE_ID` is the long id from the share URL.
  (Plain `drive.google.com/uc?...` links usually do **not** render as `<img>`.)

Leave a value empty (`""`) and a cute dashed placeholder box shows up instead — nothing breaks.

---

## 5. Test it locally

```bash
npx serve .          # static preview — chat uses built-in replies
vercel dev           # full preview — including the /api/chat AI endpoint
```

Checklist before you send the link:

- [ ] Intro → Story → Proposal navigation animates smoothly
- [ ] Buttons stack vertically on a phone, sit in a row on desktop
- [ ] YES → heart explosion + confetti rain + email arrives, and she must **type `yes`** before the final message appears
- [ ] NO → crying Cupid + reason textarea + email arrives with her text
- [ ] Want some time → date picker + email arrives with the chosen date
- [ ] Cupid chat opens on tap and replies (no red `aria-hidden` warning in the console)
- [ ] Photos load (or placeholders show)

---

## 6. Deploy on Vercel (free)

The site is static plus one serverless function (`api/chat.js`) — Vercel builds both with zero
configuration.

**Easiest — drag & drop:** go to <https://vercel.com/new>, drag the folder containing
`index.html`, press Deploy. Then do the env-var step in section 3.

**Or with the CLI:**

```bash
npm i -g vercel
vercel        # run in this folder, accept the defaults
vercel --prod # push to the production URL
```

**Or via GitHub:** push this folder to a repo → import it on Vercel → no framework preset,
no build command → Deploy. `.env.local` is gitignored, so the key never enters the repository.

After deploying: set `OPENROUTER_API_KEY` (section 3), then test the real link on her phone —
EmailJS runs in the browser, the AI runs through `/api/chat`, and both work exactly as they do
in your own tests.

---

## File overview

```
index.html   ← the entire website (edit this)
api/chat.js  ← serverless AI proxy — the OpenRouter key lives server-side
.env.local   ← local env vars (gitignored — NEVER commit)
.gitignore   ← keeps .env.local / secrets out of Git
README.md    ← this guide
```
