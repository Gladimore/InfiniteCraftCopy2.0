import { Router } from "express";
import path from "path";
import fs from "fs";
import expressRateLimit from "express-rate-limit";

import TogetherClient from "../js/TogetherClient.js";
import updateUsedTokenCount from "../js/tokenIncrementor.js";
import findCombination from "../js/findCombination.js";
import addCombination from "../js/addCombination.js";
import textToEmoji from "../js/textToEmoji.js";

const router = Router();
const client = new TogetherClient({
  model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
  max_tokens: 50,
  temperature: 1.1,
  stream: false,
});
const API_PASSWORD = process.env["API_PASSWORD"];

// Cache for system prompt
let systemPromptCache = null;

// Function to read the system prompt (with caching)
function getSystemPrompt() {
  if (systemPromptCache) return systemPromptCache;

  const filePath = path.join(process.cwd(), "data/system_prompt.txt");
  systemPromptCache = fs.readFileSync(filePath, "utf-8");
  return systemPromptCache;
}

// Helper to create user messages
function makeUserMessage(element1, element2) {
  return {
    role: "user",
    content: `${element1} and ${element2}`,
  };
}

// Helper to combine chat history with user message
function makeMessages(chatHistory, userMessage) {
  return [...chatHistory, userMessage];
}

// Function to combine elements using TogetherClient
async function combineElements(element1, element2) {
  const chatHistory = [
    {
      role: "system",
      content: getSystemPrompt(),
    },
  ];
  const combinationPrompt = makeUserMessage(element1, element2);
  const messages = makeMessages(chatHistory, combinationPrompt);

  const { message, total_tokens } = await client.send(messages);

  console.log("Combination:", message);
  console.log("Total tokens for this prompt:", total_tokens);

  const totalUsedSoFar = await updateUsedTokenCount(total_tokens);

  console.log("Total tokens used so far:", totalUsedSoFar);

  return message;
}

// Create rate limiter middleware using express-rate-limit
const rateLimiter = expressRateLimit({
  windowMs: 60 * 60000, // 1 minute
  max: 5, // Limit each IP to 5 requests per windowMs
  skip: (req) => req.body.password === API_PASSWORD, // Skip rate limiting if password is correct
  message: "Too many requests, please try again later.", // Message when rate limit is exceeded
});

// API route to handle combination requests
router.post("/combine", rateLimiter, async (req, res) => {
  const { element1, element2, password } = req.body;

  // Authentication check
  if (password !== API_PASSWORD) {
    console.log("Invalid password attempt:", password);
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Check for existing combination
    const previousCombination = await findCombination(element1, element2);

    if (!previousCombination) {
      // Generate a new combination
      const combination = await combineElements(element1, element2);
      const emoji = await textToEmoji(combination);

      // Save the new combination
      const newCombination = await addCombination(
        combination,
        element1,
        element2,
        emoji
      );
      console.log("New combination added:", newCombination);

      return res.json({ combination, emoji });
    } else {
      // Return the cached combination
      return res.json({
        combination: previousCombination.combination,
        emoji: previousCombination.emoji,
      });
    }
  } catch (error) {
    console.error("Error during combination process:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 404 handler
router.use((req, res) => {
  res.sendStatus(404);
});

export default router;
