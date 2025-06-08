// pages/api/upload-surveys.js
import { PrismaClient } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";
import * as XLSX from "xlsx";
import formidable from "formidable";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    if (!req.body) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const contentLength = req.headers.get("content-length");
    if (contentLength > 10 * 1024 * 1024) {
      // 10MB limit
      return NextResponse.json(
        { error: "File size too large. Maximum size is 10MB" },
        { status: 413 }
      );
    }

    // Verify user is admin/manager
    const { userId } = await getAuth(req);
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || (user.role !== "MANAGER" && user.role !== "OPERATIONS")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse the uploaded file
    const form = formidable();
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read the Excel file
    const fileData = await fs.readFile(file.filepath);
    const workbook = XLSX.read(fileData);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      success: 0,
      skipped: 0,
      errors: [],
    };

    // Process each row
    for (const row of data) {
      try {
        // Validate required fields
        if (!row.voiceName || !row.AHT || !row.CSAT || !row.date) {
          results.errors.push(
            `Missing required fields in row: ${JSON.stringify(row)}`
          );
          continue;
        }

        // Find user by voice name
        const targetUser = await prisma.user.findUnique({
          where: { voiceName: row.voiceName },
        });

        if (!targetUser) {
          results.errors.push(
            `No user found with voice name: ${row.voiceName}`
          );
          continue;
        }

        // Check for duplicate entry
        const existingSurvey = await prisma.survey.findFirst({
          where: {
            userId: targetUser.id,
            AHT: row.AHT,
            CSAT: Number(row.CSAT),
            date: new Date(row.date),
            comment: row.comment || null,
          },
        });

        if (existingSurvey) {
          results.skipped++;
          continue;
        }

        // Create new survey
        await prisma.survey.create({
          data: {
            userId: targetUser.id,
            voiceName: row.voiceName,
            AHT: row.AHT,
            CSAT: Number(row.CSAT),
            date: new Date(row.date),
            comment: row.comment || null,
          },
        });

        results.success++;
      } catch (error) {
        results.errors.push(`Error processing row: ${error.message}`);
      }
    }

    // Clean up temp file
    await fs.unlink(file.filepath);

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
