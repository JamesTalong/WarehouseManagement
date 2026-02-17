import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import axios from "axios";
import Loader from "../../../loader/Loader";
import ChartWrapper from "./ChartWrapper";
import { domain } from "../../../../security";

const COLORS = [
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#0088FE",
  "#FF66C4",
  "#8884d8",
];

const LocationPieChart = () => {
  const [locationData, setLocationData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();

        const response = await axios.get(
          `${domain}/api/Transactions/chart/sales-by-location?month=${month}&year=${year}`
        );

        setLocationData(response.data);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Loader />;

  // Render labels only if the slice is visible
  const renderLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    if (percent === 0) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        fontSize={12}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartWrapper title="Sales by Location">
      <PieChart>
        <Pie
          data={locationData}
          cx="50%"
          cy="45%" // Slightly higher to make room for legend
          labelLine={false}
          label={renderLabel}
          innerRadius={40} // Added inner radius for a modern "Donut" look (optional, remove if unwanted)
          outerRadius="80%" // Responsive radius
          fill="#8884d8"
          dataKey="value"
          paddingAngle={2} // Adds slight gap between slices
        >
          {locationData.map((_, i) => (
            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`₱${value.toLocaleString()}`, "Sales"]}
          contentStyle={{
            backgroundColor: "#222",
            borderRadius: "8px",
            border: "none",
            color: "#fff",
          }}
          itemStyle={{ color: "#fff" }}
        />
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
        />
      </PieChart>
    </ChartWrapper>
  );
};

export default LocationPieChart;
