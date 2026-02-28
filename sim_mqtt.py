import paho.mqtt.client as mqtt
import time
import random

broker = "broker.emqx.io"
port = 1883
topic = "mi_proyecto/sensor/rpm"

client = mqtt.Client()
client.connect(broker, port, 60)

rpm = 120.0
print("Starting MQTT simulation...")
while True:
    rpm = rpm + random.uniform(-5.0, 5.0)
    if rpm < 0: rpm = 0
    client.publish(topic, str(round(rpm, 2)))
    print(f"Published: {rpm:.2f}")
    time.sleep(2)
