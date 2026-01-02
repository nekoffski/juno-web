# Juno REST API Specification

This document describes the REST API for the Juno home automation system.

## Table of Contents

- [Supervisor Service](#supervisor-service)
- [Device Connector Service](#device-connector-service)
- [Metric Service](#metric-service)
- [Data Models](#data-models)

---

## Supervisor Service

Base namespace: `juno::api`

### Health Check

#### GET `/health`

Get the health status of the supervisor service.

**Request:** None

**Response:** `ServiceStatus`

```json
{
  "healthy": true
}
```

---

### System Health

#### GET `/health/system`

Get comprehensive system health including database and all services.

**Request:** None

**Response:** `SystemHealth`

```json
{
  "db": {
    "host": "localhost",
    "port": 5432,
    "vendor": "postgresql",
    "database": "juno",
    "status": {
      "healthy": true
    }
  },
  "services": [
    {
      "name": "device-connector",
      "status": {
        "healthy": true
      },
      "ip": "127.0.0.1",
      "port": 6008
    }
  ]
}
```

---

### Configuration Management

#### GET `/config`

Get multiple configuration values by labels.

**Request:** `ConfigLabels`

```json
{
  "labels": ["db.host", "db.port"]
}
```

**Response:** `ConfigFields`

```json
{
  "values": {
    "db.host": "localhost",
    "db.port": "5432"
  }
}
```

#### POST `/config`

Set multiple configuration values.

**Request:** `ConfigFields`

```json
{
  "values": {
    "db.host": "localhost",
    "db.port": "5432"
  }
}
```

**Response:** None

---

#### GET `/config/{label}`

Get a single configuration value by label.

**Path Parameters:**

- `label` (string): Configuration label

**Request:** None

**Response:** `ConfigField`

```json
{
  "value": "localhost"
}
```

#### POST `/config/{label}`

Set a single configuration value.

**Path Parameters:**

- `label` (string): Configuration label

**Request:** `ConfigField`

```json
{
  "value": "localhost"
}
```

**Response:** None

---

## Device Connector Service

Base namespace: `juno::api`

### Health Check

#### GET `/health`

Get the health status of the device connector service.

**Request:** None

**Response:** `ServiceStatus`

```json
{
  "healthy": true
}
```

---

### Device Management

#### GET `/device`

List all discovered devices.

**Request:** None

**Response:** `DevicesInfo`

```json
{
  "devices": [
    {
      "status": "online",
      "id": 1,
      "name": "Living Room Bulb",
      "ip": "192.168.1.100",
      "port": 55443,
      "type": "bulb",
      "capabilities": [
        "on",
        "off",
        "toggle",
        "set_brightness",
        "get_brightness",
        "set_rgb",
        "get_rgb",
        "power"
      ]
    }
  ]
}
```

#### DELETE `/device`

Delete all devices.

**Request:** None

**Response:** None

---

#### GET `/device/id/{id}`

Get information about a specific device.

**Path Parameters:**

- `id` (u64): Device ID

**Request:** None

**Response:** `DeviceInfo`

```json
{
  "device": {
    "status": "online",
    "id": 1,
    "name": "Living Room Bulb",
    "ip": "192.168.1.100",
    "port": 55443,
    "type": "bulb",
    "capabilities": [
      "on",
      "off",
      "toggle",
      "set_brightness",
      "get_brightness",
      "set_rgb",
      "get_rgb",
      "power"
    ]
  }
}
```

#### DELETE `/device/id/{id}`

Delete a specific device.

**Path Parameters:**

- `id` (u64): Device ID

**Request:** None

**Response:** None

---

### Device Actions

#### POST `/device/id/{id}/action`

Execute an action on a specific device.

**Path Parameters:**

- `id` (u64): Device ID

**Request:** `DeviceActionRequest`

```json
{
  "action": "set_brightness",
  "body": {
    "brightness": 75
  }
}
```

**Response:** `DeviceActionResponse`

```json
{
  "body": {
    "brightness": 75
  }
}
```

**Available Actions:**

- `on` - Turn device on
- `off` - Turn device off
- `toggle` - Toggle device power state
- `power` - Get current power state (returns `{"enabled": true/false}`)
- `set_brightness` - Set brightness level (body: `{"brightness": 0-100}`)
- `get_brightness` - Get current brightness (returns `{"brightness": 0-100}`)
- `set_rgb` - Set RGB color (body: `{"r": 0-255, "g": 0-255, "b": 0-255}`)
- `get_rgb` - Get current RGB color (returns `{"r": 0-255, "g": 0-255, "b": 0-255}`)

---

### Device Group Management

#### GET `/device/group`

List all device groups.

**Request:** None

**Response:** `DeviceGroups`

```json
{
  "groups": {
    "1": {
      "name": "Living Room",
      "devices": [1, 2, 3],
      "capabilities": ["on", "off", "toggle"]
    }
  }
}
```

#### POST `/device/group`

Create a new device group.

**Request:** `DeviceGroup`

```json
{
  "name": "Living Room",
  "devices": [1, 2, 3],
  "capabilities": ["on", "off", "toggle"]
}
```

**Response:** `DeviceGroupId`

```json
{
  "id": 1
}
```

---

#### GET `/device/group/id/{id}`

Get information about a specific device group.

**Path Parameters:**

- `id` (u64): Group ID

**Request:** None

**Response:** `DeviceGroup`

```json
{
  "name": "Living Room",
  "devices": [1, 2, 3],
  "capabilities": ["on", "off", "toggle"]
}
```

#### PUT `/device/group/id/{id}`

Update a device group.

**Path Parameters:**

- `id` (u64): Group ID

**Request:** `DeviceGroup`

```json
{
  "name": "Living Room Updated",
  "devices": [1, 2],
  "capabilities": ["on", "off"]
}
```

**Response:** None

#### DELETE `/device/group/id/{id}`

Delete a device group.

**Path Parameters:**

- `id` (u64): Group ID

**Request:** None

**Response:** None

---

### Device Group Actions

#### POST `/device/group/id/{id}/action`

Execute an action on all devices in a group.

**Path Parameters:**

- `id` (u64): Group ID

**Request:** `DeviceActionRequest`

```json
{
  "action": "set_brightness",
  "body": {
    "brightness": 75
  }
}
```

**Response:** `DeviceGroupActionResponse`

```json
{
  "responses": [
    {
      "body": {
        "brightness": 75
      }
    },
    {
      "body": {
        "brightness": 75
      }
    }
  ]
}
```

**Notes:**

- Returns an array of responses, one for each device in the group
- The action must be supported by the group's capabilities (if specified)
- Each device in the group must support the requested action
- Returns 400 if the group doesn't support the action
- Returns 404 if the group doesn't exist

---

## Metric Service

Base namespace: `juno::api`

### Health Check

#### GET `/health`

Get the health status of the metric service.

**Request:** None

**Response:** `ServiceStatus`

```json
{
  "healthy": true
}
```

---

### Weather Metrics

#### GET `/metrics/weather`

Get current weather metrics.

**Request:** None

**Response:** `Weather`

```json
{
  "temp": 22.5,
  "feelsLike": 21.8,
  "minTemp": 18.0,
  "maxTemp": 25.0,
  "pressure": 1013,
  "humidity": 65,
  "windSpeed": 3.5,
  "sunrise": 1640152800,
  "sunset": 1640188800
}
```

**Field Descriptions:**

- `temp` (f32): Current temperature in Celsius
- `feelsLike` (f32): Feels-like temperature in Celsius
- `minTemp` (f32): Minimum temperature in Celsius
- `maxTemp` (f32): Maximum temperature in Celsius
- `pressure` (u32): Atmospheric pressure in hPa
- `humidity` (u32): Humidity percentage (0-100)
- `windSpeed` (f32): Wind speed in m/s
- `sunrise` (i32): Sunrise time (Unix timestamp)
- `sunset` (i32): Sunset time (Unix timestamp)

---

## Data Models

### Common Types

#### ServiceStatus

```json
{
  "healthy": bool
}
```

#### ConfigField

```json
{
  "value": string
}
```

#### ConfigFields

```json
{
  "values": {
    "key": "value"
  }
}
```

#### ConfigLabels

```json
{
  "labels": ["label1", "label2"]
}
```

---

### System Models

#### Service

```json
{
  "name": string,
  "status": ServiceStatus,
  "ip": string,
  "port": u16
}
```

#### Database

```json
{
  "host": string,
  "port": u16,
  "vendor": string,
  "database": string,
  "status": ServiceStatus
}
```

#### SystemHealth

```json
{
  "db": Database,
  "services": [Service]
}
```

---

### Device Models

#### DeviceType

Enum: `"bulb"`

#### DeviceStatus

Enum: `"online"`, `"offline"`

#### Device

```json
{
  "status": DeviceStatus,
  "id": u64,
  "name": string,
  "ip": string,
  "port": u16,
  "type": DeviceType,
  "capabilities": [string]
}
```

#### DevicesInfo

```json
{
  "devices": [Device]
}
```

#### DeviceInfo

```json
{
  "device": Device
}
```

#### DeviceActionRequest

```json
{
  "action": string,
  "body": object
}
```

#### DeviceActionResponse

```json
{
  "body": object
}
```

#### DeviceGroupActionResponse

```json
{
  "responses": [DeviceActionResponse]
}
```

---

### Device Group Models

#### DeviceGroup

```json
{
  "name": string,
  "devices": [u64],
  "capabilities": [string]
}
```

#### DeviceGroupId

```json
{
  "id": u64
}
```

#### DeviceGroups

```json
{
  "groups": {
    "id": DeviceGroup
  }
}
```

---

### Device State Models

#### Power

```json
{
  "enabled": bool
}
```

#### RGB

```json
{
  "r": u8,
  "g": u8,
  "b": u8
}
```

#### Brightness

```json
{
  "brightness": u8
}
```

---

### Weather Models

#### Weather

```json
{
  "temp": f32,
  "feelsLike": f32,
  "minTemp": f32,
  "maxTemp": f32,
  "pressure": u32,
  "humidity": u32,
  "windSpeed": f32,
  "sunrise": i32,
  "sunset": i32
}
```

---

### LAN Agent Models

#### LanAgentDiscoverRequest

```json
{
  "group": string,
  "port": u16,
  "message": string
}
```

#### LanAgentDiscoverResponse

```json
{
  "responses": [string]
}
```

#### LanAgentTunnelRequest

```json
{
  "ip": string,
  "port": u16
}
```

#### LanAgentTunnelResponse

```json
{
  "port": u16
}
```

---

## Type Notation

The following type notation is used throughout this specification:

- `bool` - Boolean value (true/false)
- `str` / `string` - String value
- `u8` - Unsigned 8-bit integer (0-255)
- `u16` - Unsigned 16-bit integer (0-65535)
- `u32` - Unsigned 32-bit integer
- `u64` - Unsigned 64-bit integer
- `i32` - Signed 32-bit integer
- `f32` - 32-bit floating point number
- `json` / `object` - Arbitrary JSON object
- `Array<T>` - Array of type T
- `Dict<K, V>` - Dictionary/map with key type K and value type V
- `None` - No request/response body

---

## Error Responses

All endpoints may return the following HTTP status codes:

- `200 OK` - Successful request
- `201 Created` - Resource successfully created
- `400 Bad Request` - Invalid request parameters or body
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Notes

- All endpoints use JSON for request and response bodies
- Empty capabilities array in device groups means all device capabilities are allowed
- Device IDs are automatically assigned during discovery
- Group IDs are automatically assigned during creation
- Timestamps are represented as Unix timestamps (seconds since epoch)
