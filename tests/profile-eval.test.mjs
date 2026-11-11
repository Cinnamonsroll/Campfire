import test from "node:test";
import { PROFILE_SCALE } from "../src/images/shared/layout.ts";
import assert from "node:assert/strict";
import { Animation, Frame, Image } from "imagescript";
import {
  compositeProfileCard,
  decodeProfileAsset,
  frameAt,
  prepareAvatar,
} from "../src/images/profile/renderProfileCards.ts";

process.env.OWNER_IDS = "owner-test";
process.env.DISCORD_TOKEN ||= "test-token";
process.env.CLIENT_ID ||= "test-client";
process.env.DATABASE_URL ||= "postgresql://localhost/test";
process.env.REDIS_URL ||= "redis://localhost";
const { default: evalCommand } = await import("../src/commands/eval.ts");
const { default: handlers } =
  await import("../src/interactions/modals/eval/index.ts");
const { outputPages } = await import("../src/utils/evalReply.ts");
const { markup } = await import("../src/utils/markup.ts");
const frame = (color, duration = 100) =>
  Frame.from(new Image(20, 20).fill(color), { duration });
const avatar = () => new Animation([frame(0xff0000ff), frame(0x0000ffff)]);
const base = () => new Image(64, 48).fill(0xeeeeeeff);
const placement = { x: 8, y: 8, size: 20 };
const pixel = (image, x, y) => [...image.getRGBAAt(x, y)];

test("eval opens a paragraph modal and preserves execution options", async () => {
  let modal;
  await evalCommand.execute({
    interaction: {
      user: { id: "owner-test" },
      options: {
        getString: (name) => (name === "language" ? "ts" : "js"),
        getInteger: () => 2,
        getBoolean: () => true,
      },
      showModal: async (value) => {
        modal = value.toJSON();
      },
    },
  });
  assert.equal(modal.custom_id, "eval|2|1|ts|js");
  assert.equal(modal.components[0].component.style, 2);
  assert.equal(modal.components[0].component.max_length, 4000);
  assert.ok(
    !evalCommand.data.toJSON().options.some((option) => option.name === "code"),
  );
});

test("non-owners cannot open or submit eval", async () => {
  let denied = 0;
  const interaction = {
    user: { id: "stranger" },
    reply: async () => {
      denied++;
    },
    customId: "eval|0|0|js|",
    fields: { getTextInputValue: () => "throw new Error('should not run')" },
  };
  await evalCommand.execute({ interaction });
  await handlers.get("eval")(interaction);
  assert.equal(denied, 2);
});

test("modal executes multiline async TypeScript and replies privately", async () => {
  let deferred, result;
  await handlers.get("eval")({
    user: { id: "owner-test" },
    client: {},
    customId: "eval|1|0|ts|",
    fields: {
      getTextInputValue: () =>
        "const n: number = 7;\nconsole.log('hello');\nreturn await Promise.resolve(n * 2);",
    },
    deferReply: async (value) => {
      deferred = value;
    },
    editReply: async (value) => {
      result = value;
      return {};
    },
  });
  assert.equal(deferred.flags, 64);
  assert.match(result.embeds[0].toJSON().description, /hello\n14/);
});

test("paginated output stays within Discord embed limits", () => {
  const pages = outputPages("```@everyone".repeat(1000));
  assert.ok(pages.length > 1);
  for (const page of pages)
    assert.ok(markup.codeblock(page, "js").length < 4096);
});

test("animated avatar survives lossless WebP encoding with the correct frame colors", async () => {
  const result = await compositeProfileCard(base(), avatar(), null, placement);
  assert.equal(result.extension, "webp");
  const decoded = await decodeProfileAsset(result.buffer);
  assert.deepEqual(pixel(frameAt(decoded, 0), 18, 18), [255, 0, 0, 255]);
  assert.deepEqual(pixel(frameAt(decoded, 100), 18, 18), [0, 0, 255, 255]);
  assert.deepEqual(pixel(frameAt(decoded, 100), 8, 8), [238, 238, 238, 255]);
});

test("static avatar plus APNG decoration animates without transparent-frame trails", async () => {
  const first = new Image(24, 24);
  first.bitmap.set([0, 255, 0, 255], 0);
  const second = new Image(24, 24);
  second.bitmap.set([255, 0, 255, 255], 4);
  const apng = await new Animation([
    Frame.from(first, { duration: 100, disposalMode: "background" }),
    Frame.from(second, { duration: 100, disposalMode: "background" }),
  ]).encodeAPNG();
  const decoration = await decodeProfileAsset(apng);
  const result = await compositeProfileCard(
    base(),
    new Animation([frame(0xff0000ff)]),
    decoration,
    placement,
  );
  assert.equal(result.extension, "webp");
  const decoded = await decodeProfileAsset(result.buffer);
  assert.deepEqual(pixel(frameAt(decoded, 0), 6, 6), [0, 255, 0, 255]);
  assert.deepEqual(pixel(frameAt(decoded, 100), 6, 6), [238, 238, 238, 255]);
  assert.deepEqual(pixel(frameAt(decoded, 100), 7, 6), [255, 0, 255, 255]);
});

test("still assets produce PNG and oversized animations fall back to a still", async () => {
  const still = await compositeProfileCard(
    base(),
    new Animation([frame(0xff0000ff)]),
    null,
    placement,
  );
  assert.equal(still.extension, "png");
  const fallback = await compositeProfileCard(
    base(),
    avatar(),
    null,
    placement,
    1,
  );
  assert.equal(fallback.extension, "png");
  assert.match(fallback.notes[0], /attachment limit/);
});

test("independent frame timing honors variable durations", () => {
  const animation = new Animation([
    frame(0xff0000ff, 100),
    frame(0x0000ffff, 300),
  ]);
  assert.equal(frameAt(animation, 399), animation.frames[1]);
  assert.equal(frameAt(animation, 400), animation.frames[0]);
});

test("short loops remain animated instead of sampling the same frame twice", async () => {
  const short = new Animation([frame(0xff0000ff, 40), frame(0x0000ffff, 40)]);
  const result = await compositeProfileCard(base(), short, null, placement);
  const decoded = await decodeProfileAsset(result.buffer);
  assert.equal(decoded.frames.length, 2);
  assert.deepEqual(pixel(frameAt(decoded, 40), 18, 18), [0, 0, 255, 255]);
});

test("nearest-neighbor avatar preparation adds no blended colors or edge alpha", () => {
  const source = new Image(2, 2);
  source.bitmap.set([
    255, 0, 0, 255, 0, 0, 255, 255, 255, 0, 0, 255, 0, 0, 255, 255,
  ]);
  const original = Frame.from(source);
  const prepared = prepareAvatar(original, 24);
  assert.equal(original.width, 2, "source frames stay reusable");
  for (let i = 0; i < prepared.bitmap.length; i += 4) {
    const rgba = [...prepared.bitmap.subarray(i, i + 4)];
    assert.ok(rgba[3] === 0 || rgba[3] === 255);
    if (rgba[3])
      assert.ok(
        (rgba[0] === 255 && rgba[2] === 0) ||
          (rgba[0] === 0 && rgba[2] === 255),
      );
  }
  assert.equal(PROFILE_SCALE, 3);
});

test("WebP preserves exact colors outside the avatar without GIF quantization", async () => {
  const background = new Image(64, 48);
  for (let y = 0; y < 48; y++)
    for (let x = 0; x < 64; x++) {
      background.bitmap.set(
        [x * 4, y * 5, (x * y) % 256, 255],
        (y * 64 + x) * 4,
      );
    }
  const result = await compositeProfileCard(
    background,
    avatar(),
    null,
    placement,
  );
  const decoded = await decodeProfileAsset(result.buffer);
  for (const shown of decoded.frames) {
    for (let y = 0; y < 48; y++)
      for (let x = 34; x < 64; x++) {
        assert.deepEqual(pixel(shown, x, y), pixel(background, x, y));
      }
  }
});

test("WebP encodes only the avatar patch after the first full frame", async () => {
  const result = await compositeProfileCard(
    new Image(640, 190).fill(0xeeeeeeff),
    avatar(),
    null,
    { x: 88, y: 56, size: 44 },
  );
  const dimensions = [];
  for (let offset = 12; offset < result.buffer.length;) {
    const length = result.buffer.readUInt32LE(offset + 4);
    const type = result.buffer.toString("ascii", offset, offset + 4);
    if (type === "ANMF")
      dimensions.push([
        result.buffer.readUIntLE(offset + 14, 3) + 1,
        result.buffer.readUIntLE(offset + 17, 3) + 1,
      ]);
    offset += length + 8 + (length & 1);
  }
  assert.deepEqual(dimensions[0], [640, 190]);
  assert.ok(dimensions.length > 1);
  for (const [width, height] of dimensions.slice(1))
    assert.ok(width <= 56 && height <= 56);
});

test("standard profile commands expose the shared animated renderer", async (t) => {
  const { default: player } = await import("../src/commands/player.ts");
  const { default: statistics } = await import("../src/commands/statistics.ts");
  assert.equal(player.data.toJSON().name, "player");
  assert.equal(statistics.data.toJSON().name, "statistics");
  const { generateCamperCard, generateStatisticsCard } =
    await import("../src/images/index.ts");
  // Existing asset caches use long TTLs; they should not hold this test process open.
  const originalTimeout = globalThis.setTimeout;
  t.mock.method(globalThis, "setTimeout", (...args) =>
    originalTimeout(...args).unref(),
  );
  const bytes = await avatar().encodeGIF();
  let downloads = 0;
  t.mock.method(globalThis, "fetch", async () => {
    downloads++;
    return new Response(bytes);
  });
  const still = await new Image(20, 20).fill(0xff0000ff).encodePNG();
  const data = {
    avatarUrl: `data:image/png;base64,${Buffer.from(still).toString("base64")}`,
    characterName: "Camper",
    title: "Explorer",
    coins: 10,
    level: 1,
    xp: 5,
    xpRequired: 10,
    inventory: [],
  };
  const assets = { avatarUrl: "https://fixture/standard-profile" };
  const results = await Promise.all([
    generateCamperCard(data, assets),
    generateStatisticsCard({ ...data, statistics: [] }, assets),
  ]);
  for (const result of results) {
    assert.equal(result.extension, "webp");
    const decoded = await Animation.decode(result.buffer, {
      maxPixels: 10_000_000,
      threads: 1,
    });
    assert.equal(decoded.width, 640 * PROFILE_SCALE);
    assert.equal(decoded.frames.length, 2);
  }
  assert.equal(
    downloads,
    1,
    "both card types share the cached avatar download",
  );
});

test("profile appearance keeps guild avatars and decorations for all profile callers", async () => {
  const { resolveProfileAppearance } =
    await import("../src/discord/profileAppearance.ts");
  const user = {
    id: "camper",
    username: "camper",
    globalName: "Camper",
    displayAvatarURL: () => "https://fixture/global.png",
    avatarDecorationURL: () => null,
  };
  const member = {
    displayName: "Trail Camper",
    displayAvatarURL: (options) =>
      options.forceStatic
        ? "https://fixture/guild.png"
        : "https://fixture/guild.gif",
    displayAvatarDecorationURL: () => "https://fixture/decoration.png",
  };
  const interaction = {
    client: { users: { fetch: async () => user } },
    guild: { members: { fetch: async () => member } },
  };
  const appearance = await resolveProfileAppearance(interaction, user);
  assert.equal(appearance.assets.avatarUrl, "https://fixture/guild.gif");
  assert.equal(appearance.staticAvatarUrl, "https://fixture/guild.png");
  assert.equal(
    appearance.assets.decorationUrl,
    "https://fixture/decoration.png?size=256",
  );
  assert.equal(appearance.displayName, "Trail Camper");
});
