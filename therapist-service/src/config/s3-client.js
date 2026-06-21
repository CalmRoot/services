const { S3Client } = require('@aws-sdk/client-s3');

const region = process.env.AWS_REGION || 'us-east-1';

const s3Client = new S3Client({
  region
});

const CLINICAL_NOTES_BUCKET = process.env.CLINICAL_NOTES_BUCKET || 'calmroot-clinical-notes';

module.exports = {
  s3Client,
  CLINICAL_NOTES_BUCKET
};
