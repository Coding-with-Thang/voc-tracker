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

    // Validate the data structure
    const invalidRows = data.filter(
      (row) => !row.voiceName || !row.AHT || !row.CSAT || !row.date
    );
    if (invalidRows.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid data format",
          details: "Some rows are missing required fields",
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
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
