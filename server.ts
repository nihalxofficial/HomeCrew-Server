import express, { Request, Response } from "express";
import mongoose, { Schema, model } from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------- MODELS ----------

// User model — maps to the "user" collection Better Auth already creates/manages.
// We're not writing to this collection from here, just reading/referencing it
// (e.g. via populate) since Better Auth owns its shape and lifecycle.
const userSchema = new Schema(
  {
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
    isFeatured: {type: Boolean},
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Service = model("Service", serviceSchema);

// ---------- ROUTES ----------
app.get("/", (req: Request, res: Response) => {
  res.send({ message: "HomeCrew API is running" });
});

// Get all services
app.get("/api/services", async (req: Request, res: Response) => {
  try {
    const services = await Service.find().populate("creatorId", "name email image");
    res.status(200).json(services);
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