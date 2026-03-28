const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const backendApiKey = process.env.BACKEND_API_KEY || "";
const openaiApiKey = process.env.OPENAI_API_KEY || "";
const openaiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
const allowMockFallback =
  (process.env.ALLOW_MOCK_FALLBACK || "false").toLowerCase() === "true";
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (corsOrigins.includes("*") || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

const mockCandidates = [
  { foodName: "Bibimbap", kcalMin: 520, kcalMax: 680, confidence: 0.79 },
  { foodName: "Chicken Salad", kcalMin: 280, kcalMax: 360, confidence: 0.82 },
  { foodName: "Kimchi Fried Rice", kcalMin: 620, kcalMax: 780, confidence: 0.76 },
  { foodName: "Salmon Poke Bowl", kcalMin: 480, kcalMax: 620, confidence: 0.73 }
];

function estimateFromBuffer(buffer) {
  let hash = 0;
  for (const byte of buffer) {
    hash = (hash * 31 + byte) % 2147483647;
  }
  return mockCandidates[hash % mockCandidates.length];
}

async function estimateWithOpenAI({ buffer, mimeType, locale }) {
  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const base64Image = buffer.toString("base64");
  const imageUrl = `data:${mimeType};base64,${base64Image}`;

  const completion = await openai.chat.completions.create({
    model: openaiModel,
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You analyze food photos. Return strict JSON with keys: foodName(string), kcalMin(number), kcalMax(number), confidence(number 0-1). kcalMin must be <= kcalMax."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Locale hint: ${locale || "en-US"}. Estimate a realistic calorie range for the food in this image.`
          },
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
      }
    ]
  });

  const raw = completion.choices?.[0]?.message?.content || "";
  const parsed = JSON.parse(raw);

  const foodName = typeof parsed.foodName === "string" ? parsed.foodName : "";
  const kcalMin = Number(parsed.kcalMin);
  const kcalMax = Number(parsed.kcalMax);
  const confidence = Number(parsed.confidence);

  if (!foodName || !Number.isFinite(kcalMin) || !Number.isFinite(kcalMax)) {
    throw new Error("OpenAI response missing required fields");
  }

  return {
    foodName,
    kcalMin: Math.max(0, Math.round(Math.min(kcalMin, kcalMax))),
    kcalMax: Math.max(0, Math.round(Math.max(kcalMin, kcalMax))),
    confidence: Number.isFinite(confidence)
      ? Math.max(0, Math.min(1, Number(confidence.toFixed(2))))
      : 0.7,
    source: "openai"
  };
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "eat-run-service-backend",
    timestamp: new Date().toISOString()
  });
});

app.post("/v1/food/analyze", upload.single("image"), async (req, res) => {
  if (backendApiKey) {
    const authHeader = req.headers.authorization || "";
    const expected = `Bearer ${backendApiKey}`;
    if (authHeader !== expected) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "invalid or missing API key" }
      });
    }
  }

  if (!req.file) {
    return res.status(400).json({
      error: { code: "INVALID_IMAGE", message: "image file is required" }
    });
  }

  if (!req.file.mimetype || !req.file.mimetype.startsWith("image/")) {
    return res.status(400).json({
      error: { code: "INVALID_IMAGE", message: "only image files are supported" }
    });
  }

  try {
    const aiResult = await estimateWithOpenAI({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      locale: req.body?.locale
    });
    return res.status(200).json(aiResult);
  } catch (error) {
    if (!allowMockFallback) {
      return res.status(502).json({
        error: {
          code: "AI_ANALYSIS_FAILED",
          message: "failed to analyze image with AI model"
        }
      });
    }

    const fallback = estimateFromBuffer(req.file.buffer);
    return res.status(200).json({
      ...fallback,
      source: "mock-fallback"
    });
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: { code: "FILE_TOO_LARGE", message: "image must be 8MB or less" }
    });
  }
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "unexpected server error" }
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`EatRun backend listening on http://localhost:${port}`);
  });
}

module.exports = { app };
