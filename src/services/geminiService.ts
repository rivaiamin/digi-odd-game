// src/services/geminiService.ts
// Updated to use backend API

export interface DigimonCard {
  name: string;
  image_query: string;
  lore_hint: string;
  imageUrl?: string;
}

export interface Puzzle {
  cards: DigimonCard[];
  answer_index: number;
  connection: string;
  explanation: string;
}

export async function generatePuzzle(retryCount = 0): Promise<Puzzle> {
  const response = await fetch("/api/puzzle");
  if (!response.ok) {
    const error = await response.json();
    if (retryCount < 5 && error.error?.includes("data in DB")) {
      console.log(`Still syncing database (Attempt ${retryCount + 1}/5). Retrying in 3s...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return generatePuzzle(retryCount + 1);
    }
    throw new Error(error.error || "Failed to fetch puzzle from server");
  }
  return response.json();
}
