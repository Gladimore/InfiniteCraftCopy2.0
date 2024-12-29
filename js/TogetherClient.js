import Together from "together-ai";

const togetherAI = new Together({
  apiKey: process.env["TOGETHER_API_KEY"],
});

class TogetherClient {
  constructor(body) {
    this.body = body;
  }

  async send(messages) {
    this.body.messages = messages;
    const response = await togetherAI.chat.completions.create(this.body);

    const { usage, choices } = response;
    const { total_tokens } = usage;

    const message = choices[0].message.content;

    return { message, total_tokens };
  }
}

export default TogetherClient;
