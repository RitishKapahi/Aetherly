export function getRecommendations(current, hourly = [], daily = []) {
  if (!current || !Number.isFinite(current.temperature)) return [];
  const advice = [];
  const rainChance = hourly.slice(0, 8).reduce((highest, hour) =>
    Number.isFinite(hour.precipitationProbability) ? Math.max(highest, hour.precipitationProbability) : highest, -1);

  if (rainChance >= 45) {
    advice.push({ id: "rain", title: "Bring an umbrella", detail: `Rain is possible in the next few hours (${rainChance}% peak chance).`, icon: "umbrella", tone: "blue" });
  } else if (rainChance >= 0) {
    advice.push({ id: "outdoors", title: "Good window to get outside", detail: "The near-term forecast shows a low chance of rain.", icon: "walk", tone: "green" });
  }
  if (current.temperature >= 32) {
    advice.push({ id: "heat", title: "Take it easy in the heat", detail: "Choose shade, take breaks, and drink water if you spend time outdoors.", icon: "sun", tone: "amber" });
  } else if (current.temperature <= 12) {
    advice.push({ id: "jacket", title: "A warm layer could help", detail: "Cooler air may make a jacket comfortable outside.", icon: "jacket", tone: "violet" });
  }
  if (Number.isFinite(current.windSpeed) && current.windSpeed >= 35) {
    advice.push({ id: "wind", title: "Expect a breezy day", detail: "Secure loose items outdoors and allow extra care while cycling.", icon: "wind", tone: "slate" });
  }
  const uv = daily[0]?.uvIndex;
  if (Number.isFinite(uv) && uv >= 6) {
    advice.push({ id: "uv", title: "Sun protection may help", detail: `Today's UV index is forecast to reach ${Math.round(uv)}. Consider shade and sun protection around midday.`, icon: "sun", tone: "amber" });
  }
  return advice.slice(0, 3);
}
