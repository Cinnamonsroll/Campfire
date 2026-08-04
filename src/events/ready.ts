import { Events, ActivityType, type Client } from "discord.js";
import type { Event } from "#src/types/index.js";
import { logger } from "#src/utils/logger.js";

const event: Event = {
  name: Events.ClientReady,
  once: true,
  execute(client: Client<true>) {
    client.user.setPresence({
      activities: [
        {
          name: "Run /start to start your summer 🔥",
          type: ActivityType.Custom,
        },
      ],
      status: "online",
    });
    logger.info(`Logged in as ${client.user.tag}`);
  },
};

export default event;
