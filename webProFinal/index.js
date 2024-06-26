import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8000;

// SQLite 데이터베이스 설정
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
});

// SQLite 모델 정의
const Conversation = sequelize.define(
  "Conversation",
  {
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    character: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {}
);

// 데이터베이스와 연결 및 character 컬럼 추가
(async () => {
  // 비동기 함수 실행
  await sequelize.sync(); // 데이터베이스 동기화
  const tableInfo = await sequelize // 테이블 정보 가져오기
    .getQueryInterface()
    .describeTable("Conversations");
  if (!tableInfo.character) {
    // 컬럼 존재 여부 확인
    await sequelize // 새로운 컬럼 추가
      .getQueryInterface()
      .addColumn("Conversations", "character", {
        type: DataTypes.STRING,
        allowNull: false,
        // 기본값을 설정하여 기존 데이터와의 충돌 방지
        defaultValue: "maid",
      });
  }
})();

// OpenAI API 설정
dotenv.config();

const openaiApiKey1 = process.env.OPENAI_API_KEY1;
const openaiApiKey2 = process.env.OPENAI_API_KEY2;

// OpenAI 클라이언트 설정
const openai1 = new OpenAI({ apiKey: openaiApiKey1 });
const openai2 = new OpenAI({ apiKey: openaiApiKey2 });

// CORS 설정
app.use(cors());

// body-parser 설정
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서비스 설정
app.use(express.static(path.join(__dirname, "public")));

// EJS 뷰 엔진 설정
app.set("view engine", "ejs");

// 인덱스 페이지 렌더링
app.get("/maid", (req, res) => {
  res.render("index", { character: "maid" });
});

app.get("/doctor", (req, res) => {
  res.render("index", { character: "doctor" });
});

// 특정 캐릭터의 대화 내용 가져오기
app.get("/conversations/:character", async (req, res) => {
  const character = req.params.character;
  try {
    const conversations = await Conversation.findAll({ where: { character } });
    res.json({ conversations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "대화 내용을 가져오는 데 실패했습니다." });
  }
});

// 대화 처리
app.post("/chat/:character", async (req, res) => {
  const { message } = req.body;
  const character = req.params.character;

  try {
    // 사용자 메시지 저장
    const userMessage = await Conversation.create({
      role: "user",
      content: message,
      character,
    });

    // OpenAI를 사용하여 캐릭터의 응답 가져오기
    const openai = character === "maid" ? openai1 : openai2;
    const prompt =
      character === "maid"
        ? {
            role: "system",
            content:
              "역할: 메이드\n호칭: 나는 '주인님'이라고 불러주세요. 대화를 시작하기 전에 항상 '네, 주인님'이라고 말해주세요.\n어조: 존대어로 말씀해주세요.\n말투: 매우 공손하고 겸손하며, 주인의 편의를 최우선으로 생각하는 태도로 말씀해주세요.",
          }
        : {
            role: "system",
            content:
              "역할: 코난에 나오는 브라운 박사님\n호칭: 대화를 시작하기 전에 '학생'이라고 말해주세요.\n어조: 교수가 학생에게 말하는 느낌으로 말씀해주세요.\n말투: 지적이고 친절하며, 약간의 유머와 따뜻함을 담아 말씀해주세요. 그리고 '~다' 체 보다 '~요'체를 써주세요",
          };

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [prompt, { role: "user", content: message }],
    });

    const response = completion.choices[0].message.content;

    // 캐릭터의 응답 저장
    const assistantMessage = await Conversation.create({
      role: "assistant",
      content: response,
      character,
    });

    // 새로운 대화 기록 전송
    const conversations = await Conversation.findAll({ where: { character } });
    res.json({ conversations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "메시지 처리에 실패했습니다." });
  }
});

// 대화 삭제 엔드포인트
app.delete("/conversations/:character", async (req, res) => {
  const character = req.params.character;
  try {
    await Conversation.destroy({ where: { character } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "대화 삭제에 실패했습니다." });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 포트에서 실행 중입니다.`);
});
