# Campfire

A Discord RPG bot - gather around the fire.

## Setup

```bash
pnpm install
pnpm dev
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
pnpm dev        # Start with hot reload
pnpm build      # Compile TypeScript
pnpm start      # Run compiled output
pnpm lint       # Check code style
pnpm format     # Format code with Prettier
```
