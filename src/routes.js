import { Router } from "express";
import path from "path";
import fs from "fs";
import TogetherClient from "../js/TogetherClient.js";
import updateUsedTokenCount from "../js/tokenIncrementor.js";
import findCombination from "../js/findCombination.js";
import addCombination from "../js/addCombination.js";
import authLimiter from "../js/authLimiter.js";

const router = Router();
const client = new TogetherClient();
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
      content: await getSystemPrompt(),
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

// API route to handle combination requests
router.post("/combine", authLimiter, async (req, res) => {
  const { element1, element2, password } = req.body;

  // Authentication check
  if (password !== API_PASSWORD) {
    console.log("Invalid password attempt:", password);
    return res.status(401).json({ error: "Unauthorized" });
  }

  authLimiter.reset(req.ip);

  try {
    // Check for existing combination
    const previousCombination = await findCombination(element1, element2);

    if (!previousCombination) {
      // Generate a new combination
      const combination = await combineElements(element1, element2);

      // Save the new combination
      const newCombination = await addCombination(
        combination,
        element1,
        element2,
      );
      console.log("New combination added:", newCombination);

      return res.json({ combination });
    } else {
      // Return the cached combination
      return res.json({ combination: previousCombination.combination });
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
