---
title: "Arduino Farming Workshop"
meta: "greenhouse monitoring and control and mesh"
layout: layouts/post.njk
permalink: /workshops/westport/
image: /assets/images/cob-oven/cob-oven.webp
foundations:
  - food
  - climate
level: applied
---

# UART Input Format for companion_sensor_ble_uart_v2

## Serial settings

- Baud: 9600
- Format: 8N1 (8 data bits, no parity, 1 stop bit)
- Pin: GPIO 47 on Heltec V3
- Logic level: 3.3V (NOT 5V tolerant)

## Line format

```
MC,N=<node_id>,T=<temperature_c>,B=<battery_v>\n
```

- Lines must end with `\n` (newline). `\r\n` is also accepted (`\r` is ignored).
- All characters must be printable ASCII (0x20-0x7E). Lines containing non-printable bytes are discarded.
- Maximum line length: 127 characters.

## Fields

| Field | Description | Type | Range |
|-------|-------------|------|-------|
| N | Node ID | integer | 0 - 65535 |
| T | Temperature in Celsius | float | -100.0 to 150.0 |
| B | Battery voltage in volts | float | 0.0 to 6.0 |

## Examples

```
MC,N=7,T=24.3,B=3.98
MC,N=100,T=-5.2,B=4.15
MC,N=0,T=0.0,B=3.30
```

## What happens on parse

Each valid line immediately triggers a mesh send to the configured target gateway. The values are packed into a `REQ_TYPE_SENSOR_UPLOAD` (0x10) packet:

- `node_id` (uint16) from N
- `temperature_x10` (int16, 0.1C units) from T — e.g. 24.3C becomes 243
- `battery_mv` (uint16, millivolts) from B — e.g. 3.98V becomes 3980

## Arduino example (sender side)

```cpp
Serial.print("MC,N=7,T=");
Serial.print(temperature, 1);
Serial.print(",B=");
Serial.print(battery, 2);
Serial.println();
```
