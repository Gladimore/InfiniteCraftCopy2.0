import TogetherClient from "./js/TogetherClient.js";
import updateUsedTokenCount from "./js/tokenIncrementor.js";
import findCombination from "./js/findCombination.js";
import addCombination from "./js/addCombination.js";
import fs from "fs";
import path from "path";

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

const elements = ["God", "Evil"];

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

async function test() {
  const elements = ["Fire", "Water"];
  const previousCombination = await findCombination(...elements);

  console.log(previousCombination);

  if (!previousCombination) {
    const combination = await combineElements(...elements);
    const newCombination = await addCombination(combination, ...elements);
    console.log("New combination added:", newCombination);
  }
}

//main();
test();
