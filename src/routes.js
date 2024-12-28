import express from "express";
import path from "path";
import TogetherClient from "../js/TogetherClient.js";
import updateUsedTokenCount from "../js/tokenIncrementor.js";
import findCombination from "../js/findCombination.js";
import addCombination from "../js/addCombination.js";
import fs from "fs";

const router = express.Router();
const client = new TogetherClient();

const systemPrompt = fs.readFileSync(
  joinPath("data/system_prompt.txt"),
  "utf-8",
);

const chatHistory = [
  {
    role: "system",
    content: systemPrompt,
  },
];

const API_PASSWORD = process.env["API_PASSWORD"];

function joinPath(filePath) {
  return path.join(process.cwd(), filePath);
}

function makeUserMessage(element1, element2) {
  return {
    role: "user",
    content: `${element1} and ${element2}`,
  };
}

function makeMessages(userMessage) {
  return [...chatHistory, userMessage];
}

const authLimiter = async (req, res, next) => {
  const ip = req.ip;
  const authCounts =
    authLimiter.authCounts || (authLimiter.authCounts = new Map());
  const now = Date.now();
  const max = 5;
  const windowMs = 10 * 60 * 1000;

  let count = authCounts.get(ip);
  if (!count) {
    count = { requests: 0, timestamp: now };
  }

  if (now - count.timestamp > windowMs) {
    count.requests = 0;
    count.timestamp = now;
  }

  if (count.requests >= max) {
    const retryAfter = Math.ceil((count.timestamp + windowMs - now) / 1000);
    res.set("Retry-After", retryAfter);
    res.status(429).json({
      error: "Too many incorrect password attempts. Please try again later.",
    });
    return;
  }

  count.requests++;
  authCounts.set(ip, count);

  next();
};

// Reset authentication rate limiter
authLimiter.reset = (ip) => {
  const authCounts = authLimiter.authCounts;
  if (authCounts) {
    authCounts.delete(ip);
  }
};

async function combineElements(element1, element2) {
  const combinationPrompt = makeUserMessage(element1, element2);
  const messages = makeMessages(combinationPrompt);

  const { message, total_tokens } = await client.send(messages);

  console.log("Combination:", message);
  console.log("Total tokens for this prompt:", total_tokens);

  const totalUsedSoFar = await updateUsedTokenCount(total_tokens);

  console.log("Total tokens used so far:", totalUsedSoFar);

  return message;
}

router.post("/combine", authLimiter, async (req, res) => {
  const { element1, element2, password } = req.body;

  if (password !== API_PASSWORD) {
    console.log(password, API_PASSWORD);
    return res.status(401).json({ error: "Unauthorized" });
  }

  const previousCombination = await findCombination(element1, element2);

  console.log(previousCombination);

  if (!previousCombination) {
    const combination = await combineElements(element1, element2);
    const newCombination = await addCombination(
      combination,
      element1,
      element2,
    );
    console.log("New combination added:", newCombination);

    res.json({
      combination: combination,
    });
  } else {
    res.json({
      combination: previousCombination.combination,
    });
  }
});

router.use((req, res, next) => {
  res.sendStatus(404);
});

export default router;
