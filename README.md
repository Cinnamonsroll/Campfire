# Campfire

A Discord RPG bot - gather around the fire.

## Setup

```bash
npm install
npm dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable       | Description                       |
| -------------- | --------------------------------- |
| `DISCORD_TOKEN` | Discord bot token                 |
| `CLIENT_ID`    | Discord application client ID     |
| `DATABASE_URL` | PostgreSQL connection string       |
| `REDIS_URL`    | Redis connection string            |
| `OWNER_IDS`    | Comma-separated Discord user IDs of bot owners |

## Commands

- `/start` - Begin your summer at Camp Solstice
- `/play` - Set out on a new adventure
- `/game` - Specialized activities: `fish`, `gather`, `cook`, `catch`, `photograph`
- `/camp [user]` - View your campsite or another camper's
- `/inventory` - Browse everything you've collected
- `/journal` - Browse your field journal of discoveries
- `/daily` - View today's daily quests
- `/shop` - Browse the camp store's fresh daily supplies
- `/trade <user>` - Offer a trade to another camper
- `/player [user]` - View a camper's profile card
- `/statistics [user]` - Review a camper's lifetime stats
- `/help` - See the Campfire guide
- `/ping` - Check bot latency

## Development

```bash
npm dev        # Start with hot reload
npm build      # Compile TypeScript
npm start      # Run compiled output
npm lint       # Check code style
npm format     # Format code with Prettier
```

## Owner evaluation

`/eval [language] [depth] [highlight] [remote]` opens a multiline code modal and
is restricted to users listed in `OWNER_IDS`. The modal submission checks the
owner allowlist again. Replies are private, use Campfire embeds, and have
pagination buttons for long output (active for two minutes).

JavaScript and TypeScript run inside the bot process with `ctx`, `interaction`,
`client`, `console`, and `inspect` available. Expressions return their value;
async code can use `await` and explicit `return`. In a modal, `interaction` is the
modal submission. This is trusted owner code with full process access, not a
sandbox; blocking code can block the bot.

Fenced code blocks select their language. Other languages, or `remote:true`, use
Piston through native fetch. Set `PISTON_URL` to use another Piston instance;
the default is `https://emkc.org/api/v2/piston`. Remote execution needs a reachable
instance that permits execution; service errors are shown in the result embed.

Try `client.ws.ping`, `return await Promise.resolve(42)`, or open
`/eval language:python` and enter `print(42)`.

## Profile cards

- `/player [user]` shows the camper profile with animated avatars and decorations.
- `/statistics [user]` does the same for the statistics card.

The profile commands use Discord user and guild member profiles to include
server avatars, server decorations (falling back to the global profile), display
names, and usernames. The same renderer is also used for `/start` welcome cards.

ImageScript 3.20.2 is pinned: the linked docs currently describe v4 as upcoming.
The compositor uses object options and `Animation.frames` to avoid APIs marked
for removal in v4. Node.js 22.13 or newer is required.

Avatar GIFs and decoration APNGs are decoded as full frames and composited on a
fresh card each frame. Animated cards are lossless WebP attachments; static cards are PNGs.
Previews run at 10 fps for up to six seconds, at 3× scale (1920px wide), rendered directly at that resolution. Avatar and decoration resizing uses nearest-neighbor sampling, with hard circular
avatar masks. The base card is drawn once and animation updates only the avatar
region; repeated samples are merged and downloads are cached briefly. Discord
profile fetches use the client cache and run concurrently. Each asset is limited
to 8 MiB and eight million decoded pixels. Oversized animations use a first-frame
preview, unavailable decorations are omitted, and cards too large to attach use
a still preview. These fallbacks appear in the embed footer.

Run `npm test` for modal authorization and animation composition regression checks.
