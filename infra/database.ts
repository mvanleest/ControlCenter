// SST Infrastructure: DynamoDB
// Single operational table for v1 records.

export const controlCenterDynamo = new sst.aws.Dynamo("AppTable", {
  fields: {
    pk: "string",
    sk: "string",
    gsi1pk: "string",
    gsi1sk: "string",
    expireAt: "number",
  },
  primaryIndex: {
    hashKey: "pk",
    rangeKey: "sk",
  },
  globalIndexes: {
    Gsi1: {
      hashKey: "gsi1pk",
      rangeKey: "gsi1sk",
    },
  },
  ttl: "expireAt",
});

export const outputs = {
  table: controlCenterDynamo.name,
};
