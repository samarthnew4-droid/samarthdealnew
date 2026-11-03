import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeWhatsAppGroupLink,
  whatsappGroupLink,
} from "../app/_lib/whatsapp-group-link.ts";

test("replaces the old WhatsApp group URL in plain and Markdown descriptions", () => {
  const description = [
    "Join: https://chat.whatsapp.com/GR9V81zaR0226WSgCbN3wF",
    "[https://chat.whatsapp.com/GR9V81zaR0226WSgCbN3wF](https://chat.whatsapp.com/GR9V81zaR0226WSgCbN3wF)",
  ].join("\n");

  assert.equal(
    normalizeWhatsAppGroupLink(description),
    `Join: ${whatsappGroupLink}\n${whatsappGroupLink}`,
  );
});

test("leaves other WhatsApp group URLs unchanged", () => {
  const description = "https://chat.whatsapp.com/a-different-group";

  assert.equal(normalizeWhatsAppGroupLink(description), description);
});
