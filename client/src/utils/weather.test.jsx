import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import WeatherIcon from "../components/weather/WeatherIcon.jsx";
import { compassDirection, formatTemperature, toFahrenheit } from "./weather.js";

describe("weather display utilities", () => {
  it("converts Celsius to Fahrenheit and formats rounded values", () => {
    expect(toFahrenheit(0)).toBe(32);
    expect(toFahrenheit(25)).toBe(77);
    expect(formatTemperature(20.4, "celsius")).toBe("20°");
    expect(formatTemperature(20, "fahrenheit")).toBe("68°");
  });

  it("keeps unavailable values explicit and maps wind direction", () => {
    expect(formatTemperature(null)).toBe("—");
    expect(compassDirection(0)).toBe("N");
    expect(compassDirection(223)).toBe("SW");
    expect(compassDirection(null)).toBeNull();
  });

  it("renders an icon from the weather condition system", () => {
    const { container } = render(<WeatherIcon condition="rain" />);
    expect(container.querySelector("svg.weather-icon")).toBeInTheDocument();
  });
});
