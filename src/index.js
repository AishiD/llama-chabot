/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { Ai } from "@cloudflare/ai";
import { Hono } from "hono";

import template from "./template.html";
import streamingTemplate from "./template-streaming.html";

const app = new Hono();

app.get("/", (c) => c.html(streamingTemplate));
app.get("/b", (c) => c.html(template));

app.get("/stream", async (c) => {
  const ai = new Ai(c.env.AI);

  const query = c.req.query("query");
  const question = query || "What is the square root of 9?";

  const systemPrompt = `You are a helpful assistant.`;
  const stream = await ai.run(
    "@cf/meta/llama-3.1-8b-instruct",
    {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      stream: true,
    },
  );

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
    },
  });
});

app.post("/", async (c) => {
  const ai = new Ai(c.env.AI);

  const body = await c.req.json();
  const question = body.query || "What is the square root of 9?";

  const systemPrompt = `You are a pirate.`;

  const { response: answer } = await ai.run(
    "@cf/meta/llama-3.1-8b-instruct",
    {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
    },
  );

  return c.text(answer);
});

app.onError((err, c) => {
  return c.text(err);
});

export default app;
