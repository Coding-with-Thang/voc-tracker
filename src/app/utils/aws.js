import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadToS3 = async (fileBuffer, originalFilename) => {
  const key = `uploads/${uuidv4()}-${originalFilename}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  );

  return key;
};

export const getFromS3 = async (key) => {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    })
  );

  return response.Body;
};

export const queueProcessingJob = async (jobData) => {
  await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: process.env.AWS_SQS_QUEUE_URL,
      MessageBody: JSON.stringify(jobData),
      MessageAttributes: {
        JobType: {
          DataType: "String",
          StringValue: "SURVEY_UPLOAD",
        },
      },
    })
  );
};

export const createUploadJob = async (userId, s3Key, totalRows) => {
  const jobId = uuidv4();

  const jobData = {
    jobId,
    userId,
    s3Key,
    totalRows,
    status: "QUEUED",
    progress: 0,
    createdAt: new Date().toISOString(),
  };

  await queueProcessingJob(jobData);

  return jobId;
};
