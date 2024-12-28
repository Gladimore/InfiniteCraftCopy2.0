import Together from "together-ai";

const togetherAI = new Together({
  apiKey: process.env["TOGETHER_API_KEY"],
});

class TogetherClient {
  async send(messages) {
    const response = await togetherAI.chat.completions.create({
      messages: messages,
      model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
      max_tokens: 512,
      temperature: 1.1,
      stream: false,
    });

    const { usage, choices } = response;
    const { total_tokens } = usage;

    const message = choices[0].message.content;

    return { message, total_tokens };
  }
}

export default TogetherClient;
