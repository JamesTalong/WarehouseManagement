// import React, { useEffect, useState } from "react";
// import { PieChart, Pie, Cell, Legend } from "recharts";
// import useGetData from "../../../../CustomHooks/useGetData";
// import Loader from "../../../loader/Loader";
// import ChartWrapper from "./ChartWrapper";

// const CityPieChart = ({ showRegionChart, handleToggleChart }) => {
//   const { data: orderedData, loading: ordersLoading } = useGetData("ordered");
//   const { data: users, loading: usersLoading } = useGetData("user");
//   const { data: serialData } = useGetData("serial");

//   const [cityCounts, setCityCounts] = useState([]);

//   useEffect(() => {
//     if (orderedData && users && serialData) {
//       const mergedOrders = orderedData.flatMap((doc) => {
//         const user = users.find((user) => user.id === doc.id);
//         return (doc.orders || []).map((order, index) => {
//           const productsWithSerials = order.products.map((product) => {
//             const serialEntry = serialData.find(
//               (serial) =>
//                 serial.productId === product.id &&
//                 serial.userId === doc.id &&
//                 serial.referenceNumber === order.referenceNumber
//             );
//             return {
//               ...product,
//               serialNumbers: serialEntry ? serialEntry.serialNumbers : [],
//               referenceNumber: order.referenceNumber,
//             };
//           });
//           return {
//             ...order,
//             user,
//             products: productsWithSerials,
//             id: order.id || doc.id,
//             index,
//           };
//         });
//       });

//       const cityMap = {};
//       mergedOrders.forEach((order) => {
//         if (order.user?.province === "METRO MANILA") {
//           const city = order.user.city;
//           cityMap[city] = (cityMap[city] || 0) + 1;
//         }
//       });

//       const cityCountsArray = Object.entries(cityMap).map(([name, value]) => ({
//         name,
//         value,
//       }));
//       setCityCounts(cityCountsArray);
//     }
//   }, [orderedData, users, serialData]);

//   if (ordersLoading || usersLoading) {
//     return <Loader />;
//   }

//   const RADIAN = Math.PI / 180;
//   const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#0088FE", "#FF8042"];
//   const renderCustomizedLabel = ({
//     cx,
//     cy,
//     midAngle,
//     innerRadius,
//     outerRadius,
//     percent,
//   }) => {
//     const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
//     const x = cx + radius * Math.cos(-midAngle * RADIAN);
//     const y = cy + radius * Math.sin(-midAngle * RADIAN);

//     return (
//       <text
//         x={x}
//         y={y}
//         fill="white"
//         textAnchor={x > cx ? "start" : "end"}
//         dominantBaseline="central"
//       >
//         {`${(percent * 100).toFixed(0)}%`}
//       </text>
//     );
//   };

//   return (
//     <ChartWrapper
//       showRegionChart={showRegionChart}
//       handleToggleChart={handleToggleChart}
//     >
//       <PieChart width={400} height={400}>
//         <Pie
//           data={cityCounts}
//           cx="50%"
//           cy="50%"
//           labelLine={false}
//           label={renderCustomizedLabel}
//           outerRadius={120}
//           fill="#8884d8"
//           dataKey="value"
//         >
//           {cityCounts.map((_, index) => (
//             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//           ))}
//         </Pie>
//         <Legend layout="vertical" />
//       </PieChart>
//     </ChartWrapper>
//   );
// };

// export default CityPieChart;
