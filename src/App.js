import mqtt from "mqtt";
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
  const [dataPoints, setDataPoints] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

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

          setRpm(newRpm);
          setEfficiency(newEff);

          setDataPoints((prev) => [
            ...prev.slice(-15), // Keep last 15 points
            {
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              rpm: newRpm,
              efficiency: newEff,
            },
          ]);
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

          {/* Card 2: Efficiency */}
          <div className="kpi-card accent-green">
            <div className="kpi-header">
              <span className="kpi-title">Eficiencia</span>
              <svg width="24" height="24" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="kpi-value" style={{ color: efficiency < 50 ? "#ef4444" : "#22c55e" }}>
              {parseFloat(efficiency).toFixed(1)}
              <span className="kpi-unit">%</span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-title">Historial de Velocidad</h3>
            <Line data={chartDataRpm} options={commonChartOptions} />
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
