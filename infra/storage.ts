// SST Infrastructure: S3 storage
// Stores artifacts, logs, and uploaded knowledge files.

export const controlCenterFiles = new sst.aws.Bucket("Artifacts", {
  lifecycle: [
    {
      id: "expire-v1-artifacts",
      expiresIn: "7 days",
    },
  ],
});

export const outputs = {
  bucket: controlCenterFiles.name,
};
