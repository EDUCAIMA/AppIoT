import React, { useEffect, useState } from "react";
import { Line, linearGradient } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [temperature, setTemperature] = useState(25);
  const [humidity, setHumidity] = useState(50);
  const [dataPoints, setDataPoints] = useState([]);

// Simular datos del sensor (en la práctica, aquí iría la conexión con MQTT o una API)
  useEffect(() => {
    const interval = setInterval(() => {
      const newTemp = (40 + Math.random() * 10).toFixed(1);
      const newHum = (20 + Math.random() * 10).toFixed(1);

      setTemperature(newTemp);
      setHumidity(newHum);

      setDataPoints((prev) => [
        ...prev.slice(-10),
        {
          time: new Date().toLocaleTimeString(),
          temp: newTemp,
          hum: newHum,
        },
      ]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // 4. Configuración del gráfico
  const chartData = {
    labels: dataPoints.map((p) => p.time),
    datasets: [
      {
        label: "Temperatura (°C)",
        data: dataPoints.map((p) => p.temp),
        borderColor: "rgba(175, 203, 50, 1)",
        backgroundColor: "rgba(93, 36, 48, 0.2)",
        tension: 0.4,
      },
      {
        label: "Humedad (%)",
        data: dataPoints.map((p) => p.hum),
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      title: {
        display: true,
        text: "Datos del Sensor en Tiempo Real",
      },
    },
  };


//Interfaz visual
  return (
    <div style={{ textAlign: "center", padding: 30, fontFamily: "arial" }}>
      <h1>Panel IoT - Eduardo Caicedo</h1>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "30px",
          marginTop: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(175, 203, 50, 1)",
            padding: "30px",
            borderRadius: "12px",
            width: "150px",
          }}
        >
          <h2>{temperature} °C</h2>
          <p>T° Galpon 1</p>
        </div>

        <div
          style={{
            backgroundColor: "#cce5ff",
            padding: "20px",
            borderRadius: "12px",
            width: "150px",
          }}
        >
          <h2>{humidity} %</h2>
          <p>T° Galpon 2</p>
        </div>


        <div //Tercer cuadro Velocidad viento
          style={{
            backgroundColor: "#e8e843ff",
            padding: "20px",
            borderRadius: "12px",
            width: "150px",
          }}
        >
          <h2>{humidity} °km/Hr</h2>
          <p>T° Galpon 3</p>
        </div>
      </div>

      <div style={{ marginTop: "40px" }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
//6. Exportar el componente App
export default App;