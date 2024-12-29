import TogetherClient from "./TogetherClient.js";
import updateUsedTokenCount from "./tokenIncrementor.js";
import fs from "fs";
import path from "path";

const client = new TogetherClient({
  model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
  max_tokens: 15,
  stream: false,
});

let emojiSystemPromptCache = null;

function getEmojiSystemPrompt() {
  if (emojiSystemPromptCache) return emojiSystemPromptCache;

  const filePath = path.join(process.cwd(), "data/emoji_system_prompt.txt");
  emojiSystemPromptCache = fs.readFileSync(filePath, "utf-8");

  return emojiSystemPromptCache;
}

function makeUserMessage(text) {
  return {
    role: "user",
    content: text,
  };
}

function makeMessages(chatHistory, userMessage) {
  return [...chatHistory, userMessage];
}

async function textToEmoji(text) {
  const chatHistory = [
    {
      role: "system",
      content: getEmojiSystemPrompt(),
    },
  ];
  const emojiPrompt = makeUserMessage(text);
  const messages = makeMessages(chatHistory, emojiPrompt);

  const { message, total_tokens } = await client.send(messages);

  console.log("Emojis:", message);
  console.log("Total tokens for this prompt:", total_tokens);

  const totalUsedSoFar = await updateUsedTokenCount(
    total_tokens,
    "emoji_count",
  );

  console.log("Total emoji tokens used so far:", totalUsedSoFar);

  return message;
}

export default textToEmoji;
