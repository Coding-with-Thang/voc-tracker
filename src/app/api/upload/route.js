import { PrismaClient } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";
import { read, utils } from "xlsx";
import { NextResponse } from "next/server";
import { uploadToS3, createUploadJob } from "@/app/utils/aws";

const prisma = new PrismaClient();

const CHUNK_SIZE = 5000; // Number of rows to process in each chunk

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
      select: {
        id: true,
        role: true,
      },
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

    // Check file size (50MB limit for large files)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 50MB" },
        { status: 413 }
      );
    }

    // Convert the file to array buffer and do initial validation
    const buffer = await file.arrayBuffer();
    const workbook = read(new Uint8Array(buffer));
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = utils.sheet_to_json(worksheet);

    // Validate the data structure and types
    const invalidRows = [];
    data.forEach((row, index) => {
      if (!row.voiceName || !row.AHT || row.CSAT === undefined || !row.date) {
        invalidRows.push({
          row: index + 2, // Add 2 to account for 1-based index and header row
          error: "Missing required fields",
          data: row,
        });
        return;
      }

      // Validate CSAT is a number between 1 and 5
      const csatValue = parseFloat(row.CSAT);
      if (isNaN(csatValue) || csatValue < 1 || csatValue > 5) {
        invalidRows.push({
          row: index + 2,
          error: "CSAT must be a number between 1 and 5",
          data: row,
        });
        return;
      }

      // Validate date format
      const dateValue = new Date(row.date);
      if (isNaN(dateValue.getTime())) {
        invalidRows.push({
          row: index + 2,
          error: "Invalid date format",
          data: row,
        });
      }
    });

    if (invalidRows.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid data format",
          details: "Some rows have invalid data",
          invalidRows: invalidRows.slice(0, 10), // Only show first 10 invalid rows
        },
        { status: 400 }
      );
    }

    // Upload file to S3
    const s3Key = await uploadToS3(buffer, file.name);

    // Create upload job
    const uploadJob = await prisma.uploadJob.create({
      data: {
        userId: user.id,
        s3Key,
        status: "QUEUED",
        totalRows: data.length,
        progress: 0,
      },
    });

    // Queue the processing job
    await createUploadJob(user.id, s3Key, data.length);

    return NextResponse.json({
      jobId: uploadJob.id,
      message: "File uploaded successfully and queued for processing",
      totalRows: data.length,
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Handle Prisma-specific errors
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "Duplicate entry found",
          details: "Some records already exist in the database",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Server error",
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
