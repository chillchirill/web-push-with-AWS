export function isTimeInFiveMinuteRange(targetTimeStr, timeZone) {
    // Current time in the specified timezone
    const now = new Date(
        new Date().toLocaleString("en-US", { timeZone })
    );
    // Extract hours and minutes from the target time string (format "HH:MM")
    const [targetHours, targetMinutes] = targetTimeStr.split(':').map(Number);

    return (now.getHours() === targetHours && Math.floor(now.getMinutes() / 5) === Math.floor(targetMinutes / 5));
}


import { fetchWeatherApi } from "openmeteo";

export async function weather(lat, lon) {
const params = {
	latitude: lat,
	longitude: lon,
	hourly: ["temperature_2m", "relative_humidity_2m", "wind_speed_10m", "weather_code", "visibility"],
    forecast_days: 1,
};
const url = "https://api.open-meteo.com/v1/forecast";
const responses = await fetchWeatherApi(url, params);

// Process first location. Add a for-loop for multiple locations or weather models
const response = responses[0];

// Attributes for timezone and location
const latitude = response.latitude();
const longitude = response.longitude();
const elevation = response.elevation();
const utcOffsetSeconds = response.utcOffsetSeconds();

console.log(
	`\nCoordinates: ${latitude}°N ${longitude}°E`,
	`\nElevation: ${elevation}m asl`,
	`\nTimezone difference to GMT+0: ${utcOffsetSeconds}s`,
);

const hourly = response.hourly();

// Note: The order of weather variables in the URL query and the indices below need to match!
const weatherData = {
	hourly: {
		time: Array.from(
			{ length: (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval() }, 
			(_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
		),
		temperature_2m: hourly.variables(0).valuesArray(),
		relative_humidity_2m: hourly.variables(1).valuesArray(),
		wind_speed_10m: hourly.variables(2).valuesArray(),
		weather_code: hourly.variables(3).valuesArray(),
		visibility: hourly.variables(4).valuesArray(),
	},
};
return weatherData;
}

export function Int(str) {
  return Math.floor(Number(str));
}

export function maxAndMin(timeStart, timeEnd, dataArray) {
  let max = -1000000, min = 1000000;

  if (timeStart >= 0 && timeEnd < dataArray.length) {

    // --- MAX ---
    if (timeStart <= timeEnd) {
      for (let i = timeStart; i <= timeEnd; i++) {
        max = Math.max(max, dataArray[i]);
      }
    } else {
      for (let i = 0; i <= timeEnd; i++) {
        max = Math.max(max, dataArray[i]);
      }
      for (let i = timeStart; i < dataArray.length; i++) {
        max = Math.max(max, dataArray[i]);
      }
    }

    // --- MIN (виправлена логіка) ---
    if (timeStart <= timeEnd) {
      for (let i = timeStart; i <= timeEnd; i++) {
        min = Math.min(min, dataArray[i]);
      }
    } else {
      for (let i = 0; i <= timeEnd; i++) {
        min = Math.min(min, dataArray[i]);
      }
      for (let i = timeStart; i < dataArray.length; i++) {
        min = Math.min(min, dataArray[i]);
      }
    }
  }

  return [max, min];
}