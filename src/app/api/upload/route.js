import { PrismaClient } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";
import { read, utils } from "xlsx";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

const BATCH_SIZE = 50; // Process records in batches of 50

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

    // Validate the data structure first
    const invalidRows = data.filter(
      (row) => !row.voiceName || !row.AHT || !row.CSAT || !row.date
    );
    if (invalidRows.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid data format",
          details: "Some rows are missing required fields",
          invalidRows,
        },
        { status: 400 }
      );
    }

    // Get all unique voice names from the data
    const uniqueVoiceNames = [...new Set(data.map((row) => row.voiceName))];

    // Fetch all users with these voice names in one query
    const users = await prisma.user.findMany({
      where: {
        voiceName: {
          in: uniqueVoiceNames,
        },
      },
    });

    // Create a map for quick user lookup
    const userMap = new Map(users.map((user) => [user.voiceName, user]));

    const results = {
      success: 0,
      skipped: 0,
      errors: [],
    };

    // Process data in batches
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      const batchOperations = [];

      for (const row of batch) {
        const targetUser = userMap.get(row.voiceName);

        if (!targetUser) {
          results.errors.push(
            `No user found with voice name: ${row.voiceName}`
          );
          continue;
        }

        try {
          // Prepare the survey data
          const surveyData = {
            userId: targetUser.id,
            voiceName: row.voiceName,
            AHT: row.AHT,
            CSAT: Number(row.CSAT),
            date: new Date(row.date),
            comment: row.comment || null,
          };

          // Add operation to batch
          batchOperations.push(
            prisma.survey.upsert({
              where: {
                userId_date: {
                  userId: targetUser.id,
                  date: surveyData.date,
                },
              },
              update: surveyData,
              create: surveyData,
            })
          );
        } catch (error) {
          results.errors.push(`Error processing row: ${error.message}`);
        }
      }

      // Execute batch operations
      try {
        const batchResults = await prisma.$transaction(batchOperations);
        results.success += batchResults.length;
      } catch (error) {
        console.error("Batch processing error:", error);
        results.errors.push(`Batch processing error: ${error.message}`);
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
