# 🤖 CYCLOPS — Discord Tournament & Moderation Bot

**Automate your tournaments. Moderate with ease.**

An all-in-one esports management Discord bot built in **pure JavaScript** with `discord.js v14`. Handles full server moderation, AFK tracking, sticky messages, giveaways, greetings, and complete tournament management with multi-tournament support, registration, slot lists, IDP DMs, and Excel exports.

---

## 📋 Table of Contents

1. [Features](#-features)
2. [Quick Setup](#-quick-setup)
3. [Discord Developer Portal Setup](#-discord-developer-portal-setup)
4. [Inviting the Bot](#-inviting-the-bot)
5. [Commands](#-commands)
6. [Tournament Workflow](#-tournament-workflow)
7. [Pushing to GitHub](#-pushing-to-github)
8. [Project Structure](#-project-structure)
9. [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### 🛡️ Moderation
- Ban, kick, timeout (mute) with flexible duration parsing (`10s`, `5m`, `2h`, `1d`)
- Warning system with persistent storage and DM notifications
- Bulk message purge (1–100) with optional user filter
- Channel lock / unlock (silent — no spam messages)
- AFK system — auto-removes when you talk, alerts when AFK users are mentioned, shows duration

### 🧹 Server Tools
- Sticky messages (auto re-posts every 50 messages)
- View & remove sticky messages via dropdown menu
- Channel nuke (`/nuke` — clones and deletes the channel)
- Custom greet messages (channel + DM)
- Giveaway system with button entry & random winner selection
- Random meme command

### 🎫 Ticket System
- One-command setup with `/ticketsetup channel:#support staff_role:@Staff category:Tickets`
- Posts a clean public ticket panel with **Open Ticket** button
- Each ticket creates a **private channel** visible only to the user, the staff role, and admins
- **Claim button** — staff/admin can claim a ticket; their name appears on the button
- **Close button** — auto-deletes the ticket channel after 5 seconds
- Auto-numbered (`ticket-1-username`, `ticket-2-username`, …)
- One open ticket per user (prevents spam)

### 🏆 Tournament Manager
- **Unlimited tournaments** running in parallel
- One-click category creation with all tournament channels
- Live slot list with refresh button
- User-facing slot manager (Cancel Slot, My Slots, Rename Team)
- Auto registration from `register-here` channel (first mention = captain)
- Auto-grants `idp-access` role to captains
- DM Room ID & Password to all captains with one command
- Export confirmed teams to **Excel (`.xlsx`)** file
- Per-tournament settings (slots count, members per team, registration toggle)

### 🎨 UI / UX
- All responses use **Discord embeds** with consistent color coding
- 🔴 Red — punishments / errors
- 🟢 Green — success / unlock / unmute
- 🟡 Yellow — warnings
- 🟣 Purple — tournament panels
- Bot status rotates every 7 seconds (Watching members & servers / Listening ?setup ?help / Made with 💗 by Aditya)
- Live status: **Do Not Disturb**

---

## ⚡ Quick Setup

### Prerequisites
- Node.js 24+
- `pnpm` package manager
- A Discord bot token (see next section)

### Steps

1. **Clone the repo:**
   ```bash
   git clone https://github.com/<your-username>/<your-repo>.git
   cd <your-repo>
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set environment variables** (create a `.env` file in the project root or use Replit Secrets):
   ```env
   DISCORD_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_application_id_here
   ```

4. **Run the bot:**
   ```bash
   pnpm --filter @workspace/bot run start
   ```

The bot will auto-register all slash commands on startup. You should see:
```
[BOOT] Loaded 19 prefix commands
[BOOT] Loaded 10 slash commands
[READY] Logged in as YourBotName#1234
[READY] Registered 10 slash commands.
```

---

## 🔧 Discord Developer Portal Setup

### 1. Create the Application
1. Go to https://discord.com/developers/applications
2. Click **New Application** → give it a name
3. Copy the **Application ID** → this is your `DISCORD_CLIENT_ID`

### 2. Create the Bot
1. In the left sidebar, click **Bot**
2. Click **Reset Token** → copy the token → this is your `DISCORD_TOKEN`
   - ⚠️ Never share or commit this token. It is the password for your bot.

### 3. Enable Privileged Gateway Intents
On the **Bot** page, enable these three intents:
- ✅ **Presence Intent** — required for status rotation
- ✅ **Server Members Intent** — required for greet, member counts, AFK
- ✅ **Message Content Intent** — required for `?` prefix commands

### 4. Set the Bot Description
On the main **General Information** page, paste this into the **Description** field:

```
**CYCLOPS — Automate Your Tournaments**

An all-in-one esports management bot designed to streamline everything — from moderation to tournament organization.

**Organize like a pro. Elevate your esports experience.**

Reliable. Efficient. Completely free.
```

---

## 📨 Inviting the Bot

1. In the Developer Portal → **OAuth2** → **URL Generator**
2. Under **Scopes**, check: `bot`, `applications.commands`
3. Under **Bot Permissions**, check: **Administrator** (recommended for full tournament functionality)
4. Copy the generated URL at the bottom and open it in your browser
5. Pick the server and click **Authorize**

---

## 📚 Commands

### Prefix Commands (`?`)

| Command | Description |
|---------|-------------|
| `?ban @user reason` | Ban a user |
| `?kick @user reason` | Kick a user |
| `?mute @user 10m reason` | Timeout a user (`10s`, `5m`, `2h`, `1d` — max 28d) |
| `?unmute @user reason` | Remove timeout |
| `?warn @user reason` | Warn a user (DMs them, stores warning) |
| `?warning @user` | View all warnings for a user |
| `?afk reason` | Set yourself AFK — auto-removes when you talk |
| `?purge 1-100` | Bulk delete messages |
| `?purge @user 50` | Delete last 50 messages from a user |
| `?say <message>` | Make the bot say something |
| `?stick <message>` | Stick a message (re-posts every 50 messages) |
| `?stickinfo` | View / remove all sticky messages |
| `?lock` | Lock the current channel |
| `?unlock` | Unlock the current channel |
| `?ping` | Bot latency + status |
| `?setnick @user new name` | Change a user's nickname |
| `?mc @user` | Show user's total tracked messages |
| `?setup` | Create tournament moderator + IDP roles |
| `?t` | Open the tournament panel |
| `?sync` | **(Admin/Owner)** Re-register all slash commands instantly in this server + globally |
| `?help` | Modern interactive help menu with category dropdown |

### Slash Commands (`/`)

| Command | Description |
|---------|-------------|
| `/modlog` | Create / bind the `mod-logs` channel for action logs |
| `/greet new_channel:#welcome message:... delete_after_sec:0` | Configure greet message |
| `/greet off` | Disable greet |
| `/greetdm set title:... description:...` | DM greet for new members |
| `/greetdm off` | Disable DM greet |
| `/gstart duration:1h winners:1 prize:Nitro` | Start a giveaway |
| `/gend giveaway_id:<msg_id>` | End a giveaway early |
| `/memes` | Random meme |
| `/botinfo` | Bot stats and info |
| `/nuke` | Clone & delete the current channel |
| `/idpdmcaptains tournament:... room_id:... password:...` | DM IDP details to all team captains |
| `/slot-list tournament:...` | Post the public slot list |
| `/ticketsetup channel:#support staff_role:@Staff category:Tickets` | Configure & post the ticket panel |

### Greet Placeholders
Inside a greet message you can use:
- `{user}` — mentions the new member
- `{server}` — server name
- `{count}` — total member count

---

## 🎫 Ticket System Workflow

1. Run `/ticketsetup` once and provide:
   - `channel` — the public channel where the ticket panel will live (e.g. `#support`)
   - `staff_role` — the role allowed to view, claim and close tickets (e.g. `@Staff`)
   - `category` — the category where new ticket channels will be created (e.g. `Tickets`)
2. The bot posts a public **🎫 Need Help? Open a Ticket** panel in the chosen channel.
3. When a user clicks **Open Ticket**:
   - A new private channel `ticket-<n>-<username>` is created in your tickets category.
   - Visible **only** to the user, the staff role, and any role with Administrator permission.
   - A welcome embed pings the user and the staff role, with **Claim** and **Close** buttons.
4. **Claim** — only staff/admins can claim. The button updates to `Claimed by <Name> (Admin/Staff)` and is disabled.
5. **Close** — only the ticket owner, staff, or admins can close. The channel is auto-deleted after 5 seconds.
6. Each user can only have **one open ticket at a time** (prevents abuse).

---

## 🏆 Tournament Workflow

### One-time setup (admin)
1. Run `?setup` — creates two roles:
   - `cyclops-turney-mod` — tournament moderators
   - `idp-access` — auto-granted to team captains

### Running a tournament
1. **Open the panel:** `?t`
2. **Create Channels** — opens a modal asking for a category name (e.g. `CYCLOPS BGMI Series`). Creates a category with these channels (everyone can view, only `help-desk` and `register-here` allow sending):
   - `updates`, `info`, `rules`, `roadmap`, `schedule`, `how-to-register`, `tag-check`, `register-here`, `confirm-teams`, `query`, `point-table`, `slot-list`, `help-desk`, plus a `slot-manager` channel.
3. **Create Tournament** — opens a modal asking for tournament name + total slots + members per team. You can create **multiple tournaments per category** (e.g. one for BGMI, one for Wex Mobile).
4. **Slot Manager Channel** — pick a tournament, deploys the user-facing panel with **Cancel My Slot / My Slots / Change Team Name** buttons.
5. **Start / Pause Registration** — toggles registration for a chosen tournament. Sends a status message to the `register-here` channel.
6. **Users register** by mentioning their teammates in `register-here`. The bot:
   - Reads the first line as the team name
   - Treats the first mention as the team captain → grants `idp-access` role
   - Posts confirmation in `confirm-teams`
   - Updates the live slot-list with a refresh button
7. **Send IDP credentials:** `/idpdmcaptains tournament:<name> room_id:... password:...` — DMs all captains.
8. **Export to Excel:** From the panel, click **MS Excel File** → pick a tournament from the dropdown → bot uploads `<tournament>_teams.xlsx` with slot, team name, captain, and members.

---

## 🚀 Pushing to GitHub

Step-by-step guide for pushing this project to your GitHub account.

### Step 1 — Create a new GitHub repository
1. Go to https://github.com/new
2. Repository name: e.g. `cyclops-discord-bot`
3. Choose **Private** or **Public** — your choice
4. ❌ **Do NOT** check "Initialize with README" (we already have one)
5. Click **Create repository**
6. Copy the repo URL (e.g. `https://github.com/your-username/cyclops-discord-bot.git`)

### Step 2 — Make sure secrets are NOT committed
The project already has `.gitignore` that excludes `node_modules`, `.env`, and `bot/data/*.json`. Double-check by running:

```bash
cat .gitignore
```

If `.env` or `bot/data/` is missing, add them:
```bash
echo ".env" >> .gitignore
echo "bot/data/*.json" >> .gitignore
```

### Step 3 — Initialize git (if not already done)
```bash
git init
git branch -M main
```

### Step 4 — Stage and commit your code
```bash
git add .
git commit -m "Initial commit: CYCLOPS Discord bot"
```

### Step 5 — Connect to your GitHub repo and push
```bash
git remote add origin https://github.com/your-username/cyclops-discord-bot.git
git push -u origin main
```

### If you get an authentication error
GitHub no longer accepts passwords. You need a **Personal Access Token (PAT)**:
1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Give it a name and check the `repo` scope
4. Copy the token
5. When git asks for a password, paste the token (not your GitHub password)

### Pushing future changes
After making changes:
```bash
git add .
git commit -m "Describe what you changed"
git push
```

### 🔁 Pushing from Replit
If you're working on Replit, the easiest way is:
1. Open the **Git** tab on the left sidebar in Replit
2. Click **Connect to GitHub**
3. Authorize and pick / create your repo
4. Use the **Stage**, **Commit**, **Push** buttons in the UI

That's it — no command line needed.

### ⚠️ Things to NEVER push
- `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` in any file
- The `.env` file
- The `bot/data/` folder (contains live server data)
- The `node_modules/` folder

If you accidentally pushed your token, **immediately reset it** in the Discord Developer Portal → Bot → Reset Token.

---

## 📂 Project Structure

```
.
├── bot/                         # CYCLOPS Discord bot (pure JavaScript)
│   ├── package.json
│   ├── data/                    # Per-guild JSON storage (gitignored)
│   └── src/
│       ├── index.js             # Main entry point
│       ├── config.js            # Constants (prefix, colors, role names)
│       ├── storage.js           # JSON storage layer
│       ├── registerCommands.js  # Manual slash command registration
│       ├── commands/            # Prefix commands (?)
│       │   ├── ban.js, kick.js, mute.js, unmute.js
│       │   ├── warn.js, warning.js, afk.js
│       │   ├── purge.js, say.js, stick.js, stickinfo.js
│       │   ├── lock.js, unlock.js, ping.js
│       │   ├── setnick.js, mc.js, setup.js, t.js, help.js
│       ├── slashCommands/       # Slash commands (/)
│       │   ├── modlog.js, greet.js, greetdm.js
│       │   ├── gstart.js, gend.js, memes.js
│       │   ├── botinfo.js, nuke.js
│       │   └── idpdmcaptains.js, slot-list.js
│       ├── events/              # Event handlers
│       │   ├── ready.js              # Status rotation
│       │   ├── messageCreate.js      # Prefix dispatch + AFK + sticky
│       │   ├── interactionCreate.js  # Slash + buttons + modals + selects
│       │   └── guildMemberAdd.js     # Greet
│       ├── tournament/          # Tournament panel & handlers
│       │   ├── panel.js
│       │   └── handlers.js
│       └── utils/               # Helpers
│           ├── embeds.js, permissions.js
│           ├── parseDuration.js, modlog.js
└── README.md
```

---

## 🔧 Troubleshooting

### Bot is online but slash commands don't show up
- Slash commands are registered globally — Discord can take **up to 1 hour** to propagate them the very first time. After that, updates are nearly instant.
- Make sure `DISCORD_CLIENT_ID` is set correctly.

### `?` commands don't work
- Make sure **Message Content Intent** is enabled in the Developer Portal → Bot tab.
- Make sure the bot has **Read Messages / View Channel** permission in the channel.

### Tournament panel buttons are disabled
- You haven't created channels yet. Click **Create Channels** first.

### "I cannot ban / kick / mute that user"
- The bot's role must be **higher** than the target user's role in the role list.
- Move the bot's role to the top of the role list (or just below admin) in **Server Settings → Roles**.

### Bot crashed
- Check the workflow logs. Most common cause: missing `DISCORD_TOKEN` or token was reset on the Developer Portal.
- Restart the bot: `pnpm --filter @workspace/bot run start`

### Excel export doesn't include team members
- Members are taken from the registration message mentions. Make sure the captain mentioned every teammate when registering.

---

## 📜 License

MIT — free to use, modify, and distribute.

---

**Made with 💗 by Aditya**
