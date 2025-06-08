import { PrismaClient } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";
import { read, utils } from "xlsx";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    // Verify user is admin/manager
    const { userId } = await getAuth(req);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "No user ID found",
        },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "User not found in database",
        },
        { status: 403 }
      );
    }

    if (user.role !== "MANAGER" && user.role !== "OPERATIONS") {
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: `User role '${user.role}' not authorized. Required: MANAGER or OPERATIONS`,
        },
        { status: 403 }
      );
    }

    // Get the form data
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 10MB" },
        { status: 413 }
      );
    }

    // Convert the file to array buffer
    const buffer = await file.arrayBuffer();
    const workbook = read(new Uint8Array(buffer));
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = utils.sheet_to_json(worksheet);

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

    return NextResponse.json(results);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
