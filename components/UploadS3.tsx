import AWS from 'aws-sdk/dist/aws-sdk-react-native';
import { useState } from 'react';
AWS.config.update({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIAVFA3S3KHNW3PIE47',
    secretAccessKey: '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',
  },
});

const s3 = new AWS.S3();

export async function UploadS3(fileUri: string, bucketName: string, key: string) {
  try {
    // Fetch the file from the local path or URI and convert to Blob
    console.log("Uploading to S3...");

    const response = await fetch(fileUri);
    const blob = await response.blob();

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: blob,
    };

    const result = await s3.upload(params).promise();
    console.log("Upload successful:", result);

    return result;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}

