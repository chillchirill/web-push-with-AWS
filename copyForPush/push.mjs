import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";
import webpush from "web-push";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { isTimeInFiveMinuteRange, weather, maxAndMin, Int} from "./libs.mjs";
dotenv.config();

const client = new DynamoDBClient({
  region: "eu-west-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const docClient = DynamoDBDocumentClient.from(client);
const publicVapidKey =
  "BI3m_ozAEo0B4CzuQYql6rc9JI9HEiJfFmOPvrxlN9BPUh3ZvCmH9Bmn2wUfMjXyZcyPXCcHzjCr5CyemFKc8bo";
const privateVapidKey = process.env.PRIVATE_VAPID_KEY_HERE;
const subscriptions = [];
webpush.setVapidDetails(
  "mailto:test@test.com",
  publicVapidKey,
  privateVapidKey
);


async function readDynamo() {

  const params = {
    TableName: "Weather",
  };
  try {
    const data = await docClient.send(new ScanCommand(params));
    return data.Items;
  } catch (err) {
    return err
  };
}

//Main logic of aplication
export async function handler(event) {
  const dynamoData = await readDynamo();
  
  // console.log(dynamoData)
  dynamoData.forEach( item => {
    try {
      let notification = false;
      // console.log("Item from db:", item);
      const objq = JSON.parse(item.json.S);
      // console.log( objq);
      if(objq.time && objq.timeZone)
      if(isTimeInFiveMinuteRange(objq.time, objq.timeZone)) {
        if(objq.subscription && objq.time && objq.lat && objq.lon){
          weather(objq.lat, objq.lon).then( weatherData => {
          //> More than
          //< Less than
            const temperature = weatherData.hourly.temperature_2m;
            const windSpeed = weatherData.hourly.wind_speed_10m;
            const tempIsActive = objq.tempStart !== null && objq.tempEnd !== null;
            const windIsActive = objq.windStart !== null && objq.windEnd !== null;
            const timeTempStart = Int(objq.tempStart), timeTempEnd = Int(objq.tempEnd);
            const timeWindStart = Int(objq.windStart), timeWindEnd = Int(objq.windEnd);
            const tempVal = Int(objq.tempVal);
            const windVal = Int(objq.windVal);
            let notification = false;
            console.log( objq)
            console.log(temperature, windSpeed, timeTempStart, timeTempEnd, timeWindStart, timeWindEnd, tempVal, windVal);
            console.log(maxAndMin(timeTempStart, timeTempEnd, temperature))
            let [maxTemp, minTemp] = tempIsActive ? maxAndMin(timeTempStart, timeTempEnd, temperature) : [null,null];
            let [maxWind, minWind] = windIsActive ? maxAndMin(timeWindStart, timeWindEnd, windSpeed) : [null,null];
            console.log("Погода: ", maxTemp, minTemp, maxWind, minWind);
            if(objq.tempOp === ">") {
              if(maxTemp >= tempVal) notification = true;
            } else {
              if(minTemp <= tempVal) notification = true;
            }
            if(objq.windOp === ">") {
              if(maxWind >= windVal) notification = true;
            } else {
              if(minWind <= windVal) notification = true;
            }
            if(notification) {
              let weatherInfo = "";
              if(maxTemp !== null){
                weatherInfo += `min: ${minTemp.toFixed(1)} °C max: ${maxTemp.toFixed(1)} °C`;
              }
              if(maxWind !== null) {
                weatherInfo += `\n min: ${minTemp.toFixed(1)} m/s, max: ${maxTemp.toFixed(1)} m/s`;
              }
              const payload = JSON.stringify({
                title: objq.msg,
                body: weatherInfo,
                time: new Date().toISOString()
              });
              webpush
              .sendNotification(objq.subscription, payload)
              .then(() => {
                console.log("Push sent to", index);
              })
              .catch(err => {
                // if the user unsubscribed / endpoint is dead
                //in theory I should unsubscribe not active users, but no one pays me for this code and unit tests are also a pain, I'm too lazy.
              });
              console.log(payload)
            }
          }).catch( err => {
            console.error("Vasia weatherAPI cdox: ", err);
          });
        } 
      }
    } catch (err) {
      console.error("Error processing item:", err);
    }
  });
};

// handler()

