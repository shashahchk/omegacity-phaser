import { MCQ } from "../schema/Character";
import { promises as fs } from "fs";
import * as path from "path";
import { Room } from "@colyseus/core";
import { MyRoomState } from "../schema/MyRoomState";
import { BattleRoomState } from "../schema/BattleRoomState";

export async function loadMCQ(): Promise<MCQ[]> {
  try {
    // Read the file synchronously
    const filePath = path.join(
      __dirname,
      "../questionbank/ExampleQuestions.json",
    );
    const data = await fs.readFile(filePath, { encoding: "utf-8" });
    // Parse the JSON data
    const questionObjects: {
      options: string[];
      question: string;
      answer: string;
    }[] = JSON.parse(data);
    return questionObjects.map((obj) => new MCQ(obj));
  } catch (error) {
    console.error("Error reading the JSON file:", error);
    return [];
  }
}
