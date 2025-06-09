import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import * as fs from "fs/promises";
import path from "path";

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function runS3Tests() {
  console.log("Starting S3 tests...");

  try {
    // Test 1: List bucket contents
    console.log("\nTest 1: Listing bucket contents...");
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET,
      })
    );
    console.log(
      "Bucket contents:",
      listResponse.Contents?.length || 0,
      "files found"
    );

    // Test 2: Upload a test file
    console.log("\nTest 2: Uploading test file...");
    const testContent =
      "This is a test file for S3 upload " + new Date().toISOString();
    const testKey = `test/test-file-${Date.now()}.txt`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: testKey,
        Body: testContent,
      })
    );
    console.log("Test file uploaded successfully:", testKey);

    // Test 3: Download the test file
    console.log("\nTest 3: Downloading test file...");
    const getResponse = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: testKey,
      })
    );

    const downloadedContent = await streamToBuffer(getResponse.Body);
    console.log("Downloaded content:", downloadedContent.toString());

    // Verify content matches
    const contentMatches = downloadedContent.toString() === testContent;
    console.log("Content verification:", contentMatches ? "PASSED" : "FAILED");

    console.log("\nAll S3 tests completed successfully!");
  } catch (error) {
    console.error("\nError during S3 tests:", error);
    throw error;
  }
}

// Run the tests
console.log("S3 Configuration:");
console.log("Region:", process.env.AWS_REGION);
console.log("Bucket:", process.env.AWS_S3_BUCKET);
console.log(
  "Access Key ID:",
  process.env.AWS_ACCESS_KEY_ID
    ? "***" + process.env.AWS_ACCESS_KEY_ID.slice(-4)
    : "Not set"
);
console.log(
  "Secret Access Key:",
  process.env.AWS_SECRET_ACCESS_KEY
    ? "***" + process.env.AWS_SECRET_ACCESS_KEY.slice(-4)
    : "Not set"
);

runS3Tests().catch(console.error);
