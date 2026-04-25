import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import axios from "axios";
import fs from "fs";

const PORT = 3000;
const db = new Database("digimon.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS digimon (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT,
    level TEXT,
    attribute TEXT,
    type TEXT,
    field TEXT
  )
`);

async function syncDigimonData() {
  const row = db.prepare("SELECT COUNT(*) as count FROM digimon").get() as { count: number };
  if (row.count >= 1400) {
    console.log("Database already populated.");
    return;
  }

  console.log("Starting Digimon Data Sync (1-1400)... This might take a while.");
  const insert = db.prepare("INSERT OR REPLACE INTO digimon (id, name, image, level, attribute, type, field) VALUES (?, ?, ?, ?, ?, ?, ?)");

  for (let i = 1; i <= 1400; i++) {
    try {
      const response = await axios.get(`https://digi-api.com/api/v1/digimon/${i}`);
      const data = response.data;
      
      const level = data.levels?.[0]?.level || "Unknown";
      const attribute = data.attributes?.[0]?.attribute || "Unknown";
      const type = data.types?.[0]?.type || "Unknown";
      const field = data.fields?.[0]?.field || "Unknown";
      const image = data.images?.[0]?.href || "";

      insert.run(data.id, data.name, image, level, attribute, type, field);
      
      if (i % 50 === 0) console.log(`Synced ${i} Digimon...`);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error(`Error fetching ID ${i}:`, error.message);
      }
    }
  }
  console.log("Sync Complete.");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/puzzle", (req, res) => {
    try {
      const categories = ["attribute", "level", "type", "field"];
      const category = categories[Math.floor(Math.random() * categories.length)];

      // 1. Pick a random value for the chosen category that has at least 5 Digimon
      const valueRow = db.prepare(`
        SELECT ${category} as val FROM digimon 
        WHERE ${category} != 'Unknown' AND ${category} != ''
        GROUP BY ${category} 
        HAVING COUNT(*) >= 5 
        ORDER BY RANDOM() LIMIT 1
      `).get() as { val: string };

      if (!valueRow) {
        return res.status(500).json({ error: "Not enough data in DB. Please wait for sync." });
      }

      const connectionValue = valueRow.val;

      // 2. Fetch 3 Digimon with this value
      const sameGroup = db.prepare(`
        SELECT * FROM digimon WHERE ${category} = ? ORDER BY RANDOM() LIMIT 3
      `).all(connectionValue);

      // 3. Fetch 1 Digimon with a DIFFERENT value in the same category
      const oddOne = db.prepare(`
        SELECT * FROM digimon WHERE ${category} != ? AND ${category} != 'Unknown' AND ${category} != '' ORDER BY RANDOM() LIMIT 1
      `).get(connectionValue) as any;

      if (sameGroup.length < 3 || !oddOne) {
        return res.status(500).json({ error: "Failed to generate puzzle with current data." });
      }

      // Combine and Shuffle
      const cards = (sameGroup as any[]).concat(oddOne).map(d => ({
        name: d.name,
        image_query: d.name,
        lore_hint: `${d.level} | ${d.type}`,
        imageUrl: d.image,
        categoryValue: d[category]
      }));

      const shuffled = cards.sort(() => Math.random() - 0.5);
      const answerIndex = shuffled.findIndex(c => c.name === oddOne.name);

      const categoryNames: Record<string, string> = {
        attribute: "Attribute",
        level: "Digivolution Level",
        type: "Type",
        field: "Field"
      };

      res.json({
        cards: shuffled,
        answer_index: answerIndex,
        connection: `These three are all ${connectionValue} (${categoryNames[category]}).`,
        explanation: `${oddOne.name} is the odd one out! The others are all ${connectionValue} ${categoryNames[category]}, while ${oddOne.name} is ${oddOne[category]}.`
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });

  // Sync data in background
  syncDigimonData();

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
