const mqtt = require("mqtt");

const broker = "wss://broker.emqx.io:8084/mqtt";
const topic = "mi_proyecto/sensor/rpm";

const options = {
    reconnectPeriod: 2000,
    connectTimeout: 4000,
};

const client = mqtt.connect(broker, options);

client.on("connect", () => {
    console.log("Connected to MQTT broker for simulation.");

    let rpm = 120.0;

    setInterval(() => {
        // Generate a new RPM value that changes slightly
        rpm += (Math.random() - 0.5) * 10;
        if (rpm < 0) rpm = 0;

        const message = rpm.toFixed(2);
        client.publish(topic, message, () => {
            console.log(`Published ${message} to ${topic}`);
        });
    }, 2000);
});

client.on("error", (err) => {
    console.error(err);
});
