import { PrismaClient } from "@prisma/client";
import { read, utils } from "xlsx";
import { getFromS3 } from "../app/utils/aws";
import {
  SQSClient,
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";

const prisma = new PrismaClient();
const CHUNK_SIZE = 1000;

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function processChunk(rows, userMap) {
  const operations = [];
  const errors = [];

  for (const row of rows) {
    const targetUser = userMap.get(row.voiceName);

    if (!targetUser) {
      errors.push(`No user found with voice name: ${row.voiceName}`);
      continue;
    }

    try {
      // Parse and validate CSAT value
      const csatValue = parseFloat(row.CSAT);
      if (isNaN(csatValue) || csatValue < 1 || csatValue > 5) {
        errors.push(
          `Invalid CSAT value for voice name ${row.voiceName}: ${row.CSAT}`
        );
        continue;
      }

      // Parse and validate date
      const dateValue = new Date(row.date);
      if (isNaN(dateValue.getTime())) {
        errors.push(
          `Invalid date format for voice name ${row.voiceName}: ${row.date}`
        );
        continue;
      }

      const surveyData = {
        userId: targetUser.id,
        voiceName: row.voiceName,
        AHT: row.AHT,
        CSAT: csatValue,
        date: dateValue,
        comment: row.comment || null,
      };

      operations.push(
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
      errors.push(
        `Error processing row for voice name ${row.voiceName}: ${error.message}`
      );
    }
  }

  if (operations.length > 0) {
    try {
      await prisma.$transaction(operations);
    } catch (error) {
      errors.push(`Batch operation error: ${error.message}`);
      throw error; // Re-throw to be handled by the caller
    }
  }

  return {
    processed: operations.length,
    errors,
  };
}

async function processUploadJob(jobData) {
  const { jobId, userId, s3Key, totalRows } = jobData;

  try {
    // Update job status to processing
    await prisma.uploadJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING" },
    });

    // Get file from S3
    const fileBuffer = await getFromS3(s3Key);
    const workbook = read(fileBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = utils.sheet_to_json(worksheet);

    // Get all unique voice names
    const uniqueVoiceNames = [...new Set(data.map((row) => row.voiceName))];

    // Fetch all users with these voice names
    const users = await prisma.user.findMany({
      where: {
        voiceName: {
          in: uniqueVoiceNames,
        },
      },
    });

    // Create user map for quick lookup
    const userMap = new Map(users.map((user) => [user.voiceName, user]));

    let processedCount = 0;
    let errorCount = 0;
    const allErrors = [];

    // Process in chunks
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, Math.min(i + CHUNK_SIZE, data.length));
      const { processed, errors } = await processChunk(chunk, userMap);

      processedCount += processed;
      errorCount += errors.length;
      allErrors.push(...errors);

      // Update progress
      const progress = Math.round(((i + chunk.length) / data.length) * 100);
      await prisma.uploadJob.update({
        where: { id: jobId },
        data: { progress },
      });
    }

    // Update job status to completed
    await prisma.uploadJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        progress: 100,
        error:
          allErrors.length > 0 ? JSON.stringify(allErrors.slice(0, 100)) : null,
      },
    });
  } catch (error) {
    console.error("Error processing upload job:", error);
    await prisma.uploadJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: error.message,
      },
    });
  }
}

async function pollQueue() {
  while (true) {
    try {
      const response = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: process.env.AWS_SQS_QUEUE_URL,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 20,
          MessageAttributeNames: ["All"],
        })
      );

      if (response.Messages) {
        for (const message of response.Messages) {
          const jobData = JSON.parse(message.Body);

          await processUploadJob(jobData);

          // Delete message from queue
          await sqsClient.send(
            new DeleteMessageCommand({
              QueueUrl: process.env.AWS_SQS_QUEUE_URL,
              ReceiptHandle: message.ReceiptHandle,
            })
          );
        }
      }
    } catch (error) {
      console.error("Error polling queue:", error);
      // Wait before retrying on error
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// Start the worker
console.log("Starting upload processor worker...");
pollQueue().catch(console.error);
