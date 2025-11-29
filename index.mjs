import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
dotenv.config();

const client = new DynamoDBClient({
  region: "eu-west-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const docClient = DynamoDBDocumentClient.from(client);

async function writeToDynamo(strElem) {
  const params = {
    TableName: "Weather",
    Item: {
        userid: randomUUID(),
        json: strElem,
        createdAt: new Date().toISOString(),
    }
  };

  try {
    await docClient.send(new PutCommand(params));
    return "OK";
  } catch (err) {
    return err+"Not added to db";
  }
}




export async function handler(event) {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*", // дозволяє запити з будь-якого сайту
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // Preflight request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  // Читаємо JSON тіло запиту
  // const data = JSON.parse(event || "{}");
  console.log("Goi: "+typeof(event));
    let ans = await writeToDynamo(JSON.stringify(event));
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: "POST received successfully!",
      received: JSON.stringify(event),
      dbStatus: ans
    })
  };
};

console.log(await writeToDynamo('{"test":"test"}'));

