import express, { Request, Response } from "express";
import mongoose, { Schema, model } from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


// ---------- MODELS ----------
interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface GeneratedListing {
  title: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  priceUnit: "fixed" | "hourly";
  duration: string;
  tags: string[];
  whatsIncluded: string[];
  availableCities: string[];
}


const userSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    image: { type: String, default: "" },
    role: { type: String, default: "user" },
    plan: { type: String, default: "free" },
    status: { type: String, default: "active" }
  },
  { timestamps: true, collection: "user" }
);

const User = model("User", userSchema);

const serviceSchema = new Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },
    price: { type: Number, required: true },
    priceUnit: { type: String, enum: ["fixed", "hourly"], default: "fixed" },
    duration: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    tags: [String],
    whatsIncluded: [String],
    availableCities: [String],
    isFeatured: { type: Boolean },
    creatorId: { type: String, ref: "User", required: true },
  },
  { timestamps: true }
);

const Service = model("Service", serviceSchema);

// ---------- ROUTES ----------
app.get("/", (req: Request, res: Response) => {
  res.send({ message: "HomeCrew API is running" });
 });

app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body as {
      message: string;
      history?: ChatMessage[];
    };

    if (!message) {
      return res.status(400).json({ message: "message is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest", // currently resolves to gemini-3.5-flash
      systemInstruction: "...",
    });

    const chat = model.startChat({
      history: (history ?? []).map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    });

    const result = await chat.sendMessage(message);

    const reply = result.response.text();

    res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat error:", error); // make sure this is here too
    res.status(500).json({ message: "Chat failed" });
  }
});

app.post("/api/services/generate", async (req: Request, res: Response) => {
  try {
    const { idea } = req.body as { idea: string };
    if (!idea) {
      return res.status(400).json({ message: "idea is required" });
    }

    const existingCategories = await Service.distinct("category");

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "user",
          content: `A service provider gave this rough idea for a home service listing: "${idea}"

Existing categories on the platform: ${existingCategories.join(", ")}
If none fit well, suggest a new short category name (select from existing or new).

Generate a complete, realistic service listing. Respond ONLY with valid JSON, no markdown, no preamble:
{
  "title": "<short catchy title>",
  "category": "<best fitting category>",
  "shortDescription": "<one sentence, under 100 characters>",
  "fullDescription": "<2-3 sentences describing the service in detail>",
  "price": <realistic number, no currency symbol>,
  "priceUnit": "fixed" or "hourly",
  "duration": "<e.g. '1-2 hours', '30 mins'>",
  "tags": [<3-5 relevant lowercase keyword strings>],
  "whatsIncluded": [<3-4 detail strings of what the service includes>],
  "availableCities": [<2-3 realistic city names where this service is offered>]
}`,
        },
      ],
    });

    const text = response.choices[0].message.content ?? "{}";
    const generated: GeneratedListing = JSON.parse(text.trim());

    res.status(200).json(generated);
  } catch (error) {
    console.error("Service generation error:", error);
    res.status(500).json({ message: "Failed to generate listing" });
  }
});

// Get all services
app.get("/api/services", async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      creatorId,
      minPrice,
      maxPrice,
      sort = "newest",
      page = "1",
      limit = "8",
    } = req.query;

    // ---------- BUILD FILTER ----------
    const filter: Record<string, any> = {};

    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      filter.$or = [
        { title: searchRegex },
        { shortDescription: searchRegex },
        { tags: searchRegex },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (creatorId) {
      filter.creatorId = creatorId;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // ---------- BUILD SORT ----------
    const sortOptions: Record<string, any> = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
    };
    const sortQuery = sortOptions[sort as string] || sortOptions.newest;

    // ---------- PAGINATION ----------
    const pageNum = Math.max(Number(page), 1);
    const limitNum = Math.max(Number(limit), 1);
    const skip = (pageNum - 1) * limitNum;

    // ---------- QUERY ----------
    const [services, totalCount] = await Promise.all([
      Service.find(filter)
        // .populate("creatorId", "name email image")
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum),
      Service.countDocuments(filter),
    ]);

    res.status(200).json({
      data: services,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch services" });
  }
});

// Get one service
app.get("/api/services/:id", async (req: Request, res: Response) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      "creatorId",
      "name email image"
    );
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch service" });
  }
});

// Create service
app.post("/api/services", async (req: Request, res: Response) => {
  try {
    const service = req.body;
    const result = await Service.create(service);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: "Failed to create service" });
  }
});

// Update service
app.patch("/api/services/:id", async (req: Request, res: Response) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.status(200).json(service);
  } catch (error) {
    res.status(400).json({ message: "Failed to update service" });
  }
});

// Delete service
app.delete("/api/services/:id", async (req: Request, res: Response) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.status(200).json({ message: "Service deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete service" });
  }
});

// ---------- DB CONNECT + START ----------
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection failed:", err));

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;