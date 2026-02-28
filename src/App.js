import mqtt from "mqtt/dist/mqtt";
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Chart Logic Helpers
const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: "top",
      align: "end",
      labels: {
        color: "#94a3b8", // Slate 400
        font: { family: "'Inter', sans-serif", size: 12 },
        boxWidth: 10,
        usePointStyle: true,
      },
    },
    title: { display: false },
    tooltip: {
      backgroundColor: "#1e293b",
      titleColor: "#f8fafc",
      bodyColor: "#cbd5e1",
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { color: "rgba(255,255,255,0.05)" },
      ticks: { color: "#64748b" },
    },
    y: {
      grid: { color: "rgba(255,255,255,0.05)" },
      ticks: { color: "#64748b" },
      beginAtZero: true,
    },
  },
};

function App() {
  const [rpm, setRpm] = useState(0);
  const [efficiency, setEfficiency] = useState(0);
  
  // Estados para métricas de ladrillos
  const [totalBricks, setTotalBricks] = useState(0);
  const [bricksPerMin, setBricksPerMin] = useState(0);
  const [bricksPerHour, setBricksPerHour] = useState(0);
  const [bricksPerDay, setBricksPerDay] = useState(0);
  
  const [dataPoints, setDataPoints] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Referencias para el cálculo integral en el tiempo
  const totalRevolutionsRef = React.useRef(0);
  const lastMessageTimeRef = React.useRef(Date.now());

  useEffect(() => {
    // 1. Apuntamos al broker gratuito que estamos usando
    const brokerUrl = "wss://broker.emqx.io:8084/mqtt";
    const options = {
      reconnectPeriod: 2000,
      connectTimeout: 4000,
    };

    const client = mqtt.connect(brokerUrl, options);

    client.on("connect", () => {
      console.log("✅ Conectado al broker MQTT");
      setIsConnected(true);
      // 2. Nos suscribimos al mismo Topic que le pusimos al código de Arduino
      client.subscribe("mi_proyecto/sensor/rpm", (err) => {
        if (!err) console.log("📡 Suscrito al tópico mi_proyecto/sensor/rpm");
      });
    });

    client.on("message", (topic, message) => {
      try {
        if (topic === "mi_proyecto/sensor/rpm") {
          // 3. El Arduino envía un número en texto ("120.00"), no un JSON, así que lo leemos directo
          const valorString = message.toString();
          const newRpm = parseFloat(valorString) || 0;

          // Como el Arduino por ahora solo envía RPM, dejamos un valor fijo para eficiencia 
          // (o lo puedes calcular aquí matemáticamente después)
          const newEff = newRpm > 0 ? 100.0 : 0;

          // Integración de RPM para calcular revoluciones totales
          const currentTime = Date.now();
          // Diferencia de tiempo en minutos
          const deltaTimeMinutes = (currentTime - lastMessageTimeRef.current) / 60000;
          lastMessageTimeRef.current = currentTime;

          // Integración: Sumar las revoluciones ocurridas en este delta de tiempo
          // (Asumiendo velocidad constante durante el delta)
          const revolutionsInInterval = newRpm * deltaTimeMinutes;

          // Evitamos acumular saltos gigantes si el cliente se desconectó por mucho tiempo (>5 mins)
          if (deltaTimeMinutes < 5) {
            totalRevolutionsRef.current += revolutionsInInterval;
          }

          // 1 ladrillo por cada 15 revoluciones
          const newTotalBricks = Math.floor(totalRevolutionsRef.current / 15);

          // Tasas de producción (Ladrillos por minuto = RPM / 15)
          const ratePerMin = newRpm / 15;
          const ratePerHour = ratePerMin * 60;
          const ratePerDay = ratePerHour * 24;

          setRpm(newRpm);
          setEfficiency(newEff);
          setTotalBricks(newTotalBricks);
          setBricksPerMin(ratePerMin);
          setBricksPerHour(ratePerHour);
          setBricksPerDay(ratePerDay);

          setDataPoints((prev) => {
            const lastPoints = prev.slice(-15);

            return [
              ...lastPoints,
              {
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                rpm: newRpm,
                efficiency: newEff,
                productionRate: ratePerHour, // Guardamos la tasa por hora para graficar
              },
            ];
          });
        }
      } catch (e) {
        console.error("❌ Error al parsear MQTT:", e);
      }
    });

    client.on("close", () => setIsConnected(false));
    client.on("error", (err) => console.error("⚠️ Error MQTT:", err));

    return () => client.end();
  }, []);

  const chartDataRpm = {
    labels: dataPoints.map((p) => p.time),
    datasets: [
      {
        label: "RPM Actual",
        data: dataPoints.map((p) => p.rpm),
        borderColor: "#3b82f6", // Blue 500
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#1e293b",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Nueva gráfica: Tasa de Producción (Ladrillos/Hora)
  const chartDataProduction = {
    labels: dataPoints.map((p) => p.time),
    datasets: [
      {
        label: "Producción (Ladrillos / Hora)",
        data: dataPoints.map((p) => p.productionRate),
        borderColor: "#f59e0b", // Amber 500
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        pointBackgroundColor: "#f59e0b",
        pointBorderColor: "#1e293b",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartDataEff = {
    labels: dataPoints.map((p) => p.time),
    datasets: [
      {
        label: "Eficiencia (%)",
        data: dataPoints.map((p) => p.efficiency),
        borderColor: "#22c55e", // Green 500
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        pointBackgroundColor: "#22c55e",
        pointBorderColor: "#1e293b",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-title">
          <h1>LADRILLERA VILLA LAURA</h1>
          <h2>Monitor de Producción en Tiempo Real</h2>
        </div>
        <div className="status-badge">
          <div className={`status-dot ${isConnected ? "active" : "inactive"}`}
            style={{ color: isConnected ? "#22c55e" : "#ef4444" }} />
          {isConnected ? "SISTEMA ONLINE" : "DESCONECTADO"}
        </div>
      </header>

      <main className="dashboard-content">
        {/* KPI Cards Grid */}
        <div className="kpi-grid">
          {/* Card 1: RPM */}
          <div className="kpi-card accent-blue">
            <div className="kpi-header">
              <span className="kpi-title">Velocidad Actual</span>
              <svg width="24" height="24" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="kpi-value">
              {parseFloat(rpm).toFixed(1)}
              <span className="kpi-unit">RPM</span>
            </div>
          </div>

          {/* Card 2: Ladrillos Producidos Totales */}
          <div className="kpi-card accent-amber">
            <div className="kpi-header">
              <span className="kpi-title">Total Producido</span>
              <svg width="24" height="24" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="kpi-value text-amber">
              {totalBricks}
              <span className="kpi-unit">Ladrillos</span>
            </div>
          </div>

          {/* Card 3: Tasa por Minuto */}
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Producción / Minuto</span>
              <svg width="24" height="24" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="kpi-value">
              {parseFloat(bricksPerMin).toFixed(1)}
              <span className="kpi-unit">Und/min</span>
            </div>
          </div>

          {/* Card 4: Tasa por Hora */}
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Producción / Hora</span>
              <svg width="24" height="24" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="kpi-value">
              {parseFloat(bricksPerHour).toFixed(0)}
              <span className="kpi-unit">Und/hr</span>
            </div>
          </div>

          {/* Card 5: Tasa por Día */}
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Producción / Día</span>
              <svg width="24" height="24" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="kpi-value">
              {parseFloat(bricksPerDay).toFixed(0)}
              <span className="kpi-unit">Und/día</span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid custom-grid-3">
          <div className="chart-card">
            <h3 className="chart-title">Historial de Velocidad (RPM)</h3>
            <Line data={chartDataRpm} options={commonChartOptions} />
          </div>
          <div className="chart-card">
            <h3 className="chart-title">Tasa de Producción (Ladrillos/Hora)</h3>
            <Line data={chartDataProduction} options={{
              ...commonChartOptions,
            }} />
          </div>
          <div className="chart-card">
            <h3 className="chart-title">Historial de Eficiencia</h3>
            <Line data={chartDataEff} options={{
              ...commonChartOptions,
              scales: {
                ...commonChartOptions.scales,
                y: { ...commonChartOptions.scales.y, max: 100 }
              }
            }} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
