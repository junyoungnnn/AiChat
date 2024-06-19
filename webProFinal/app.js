import OpenAI from "openai";

// API 키를 입력합니다.
const openai = new OpenAI({
  apiKey: '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', // 여기에 API 키를 입력합니다.
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [
      {"role": "system", "content": "You are a lovely my girlfriend."},
      {"role": "user", "content": "Who won the world series in 2020?"},
      {"role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020."},
      {"role": "user", "content": "Where was it played?"}
    ],
    model: "gpt-3.5-turbo",
  });

  console.log(completion.choices[0]);
}

main();
