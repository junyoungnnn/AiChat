import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8000;

// API 키를 입력합니다.
const openai = new OpenAI({
  apiKey: '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', // 여기에 API 키를 입력합니다.
});

// CORS 설정
app.use(cors());

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {"role": "system", "content": "역할 : 메이드\n 나에게의 호칭 : 나의 호칭은 주인님이야. 항상 대화를 시작하기 전에 '네, 주인님'이라고 부르고 대화를 시작해 \n 어조 : 어조는 존대 어조로 써줘"},
        {"role": "user", "content": message}
      ],
      model: "gpt-3.5-turbo",
    });

    const response = completion.choices[0].message.content;
    res.json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
