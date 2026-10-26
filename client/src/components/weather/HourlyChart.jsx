import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatClock, formatTemperature } from "../../utils/weather.js";

const TEMPERATURE_CHART_TICK_COUNT = 6;

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><span>{label}</span><strong>{formatTemperature(payload[0].value, unit)}</strong></div>;
}

export default function HourlyChart({ data, unit, timezone }) {
  const points = useMemo(() => (data ?? []).map((hour) => ({
    ...hour,
    label: formatClock(hour.time, timezone, { hour: "numeric", minute: undefined }),
  })), [data, timezone]);
  return (
    <section className="panel chart-panel">
      <div className="section-heading"><div><span className="section-kicker">THE NEXT 24 HOURS</span><h2>Hourly outlook</h2></div><span className="section-meta">Temperature</span></div>
      <div className="chart-wrap" role="img" aria-label="Line chart showing the hourly temperature forecast for the next 24 hours">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 14, right: 5, bottom: 0, left: -17 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 5" />
            <XAxis dataKey="label" interval={Math.max(0, Math.floor((points.length - 1) / TEMPERATURE_CHART_TICK_COUNT))} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} dy={11} />
            <YAxis domain={["dataMin - 3", "dataMax + 3"]} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(value) => formatTemperature(value, unit)} width={46} />
            <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: "var(--line)", strokeDasharray: "4 5" }} />
            <Line type="monotone" dataKey="temperature" stroke="var(--accent)" strokeWidth={2.6} dot={false} activeDot={{ r: 5, fill: "var(--accent)", stroke: "var(--panel)", strokeWidth: 3 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
