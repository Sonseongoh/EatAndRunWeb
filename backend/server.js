const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const { createAnalyzeRateLimiters } = require("./rate-limit");

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
const rateLimiters = createAnalyzeRateLimiters();

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

function estimateFromText(text) {
  let hash = 0;
  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) % 2147483647;
  }
  return mockCandidates[hash % mockCandidates.length];
}

function parseAnalysisResult(raw) {
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
      : 0.7
  };
}

function validateApiKey(req, res) {
  if (!backendApiKey) return true;
  const authHeader = req.headers.authorization || "";
  const expected = `Bearer ${backendApiKey}`;
  if (authHeader !== expected) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "invalid or missing API key" }
    });
    return false;
  }
  return true;
}

function resolveUserRateLimitKey(req) {
  const fromHeader = String(req.headers["x-user-id"] || "").trim();
  if (!fromHeader) return null;
  return `user:${fromHeader}`;
}

function resolveIpRateLimitKey(req) {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "").trim();
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return `ip:${firstIp}`;
  }

  const fromIp = String(req.ip || "").trim();
  if (fromIp) return `ip:${fromIp}`;

  return "ip:anonymous";
}

function applyRateLimitHeaders(res, result) {
  res.setHeader("X-RateLimit-Limit", String(result.limit));
  res.setHeader("X-RateLimit-Remaining", String(result.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
}

function validateRateLimit(req, res, limiters) {
  const userKey = resolveUserRateLimitKey(req);
  const ipKey = resolveIpRateLimitKey(req);

  const userResult = userKey ? limiters.user.take(userKey) : null;
  const ipResult = limiters.ip.take(ipKey);

  if (userResult) {
    res.setHeader("X-RateLimit-User-Limit", String(userResult.limit));
    res.setHeader("X-RateLimit-User-Remaining", String(userResult.remaining));
    res.setHeader("X-RateLimit-User-Reset", String(Math.ceil(userResult.resetAt / 1000)));
  }
  res.setHeader("X-RateLimit-Ip-Limit", String(ipResult.limit));
  res.setHeader("X-RateLimit-Ip-Remaining", String(ipResult.remaining));
  res.setHeader("X-RateLimit-Ip-Reset", String(Math.ceil(ipResult.resetAt / 1000)));

  const blocked = userResult && !userResult.allowed ? userResult : !ipResult.allowed ? ipResult : null;
  if (blocked) {
    applyRateLimitHeaders(res, blocked);
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      }
    });
    return false;
  }

  applyRateLimitHeaders(res, userResult ?? ipResult);
  return true;
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
  return {
    ...parseAnalysisResult(raw),
    source: "openai"
  };
}

async function estimateTextWithOpenAI({ text, locale }) {
  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const completion = await openai.chat.completions.create({
    model: openaiModel,
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You analyze user-entered meal descriptions. Return strict JSON with keys: foodName(string), kcalMin(number), kcalMax(number), confidence(number 0-1). kcalMin must be <= kcalMax."
      },
      {
        role: "user",
        content: `Locale hint: ${locale || "en-US"}. Meal text: ${text}`
      }
    ]
  });

  const raw = completion.choices?.[0]?.message?.content || "";
  return {
    ...parseAnalysisResult(raw),
    source: "openai-text"
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
  if (!validateApiKey(req, res)) return;
  if (!validateRateLimit(req, res, rateLimiters.image)) return;

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

app.post("/v1/food/analyze-text", async (req, res) => {
  if (!validateApiKey(req, res)) return;
  if (!validateRateLimit(req, res, rateLimiters.text)) return;

  const text = String(req.body?.text || "").trim();
  const locale = String(req.body?.locale || "ko-KR");
  if (!text) {
    return res.status(400).json({
      error: { code: "INVALID_TEXT", message: "text is required" }
    });
  }

  try {
    const aiResult = await estimateTextWithOpenAI({ text, locale });
    return res.status(200).json(aiResult);
  } catch (error) {
    if (!allowMockFallback) {
      return res.status(502).json({
        error: {
          code: "AI_ANALYSIS_FAILED",
          message: "failed to analyze text with AI model"
        }
      });
    }

    const fallback = estimateFromText(text);
    return res.status(200).json({
      ...fallback,
      source: "mock-text-fallback"
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

