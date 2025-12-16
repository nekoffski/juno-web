import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import { Card, CardContent, Typography, Button, Box, Chip } from "@mui/material";

interface Device {
  id: number;
  name: string;
  type: string;
  ip: string;
  port: number;
  status: string;
  capabilities: string[];
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

// Read from environment variables (must use REACT_APP_ prefix for CRA)
const getApiBaseUrl = () => {
  const host = process.env.REACT_APP_JUNO_PROXY;
  return `http://${host}/juno-device-connector`;
};

const API_BASE_URL = getApiBaseUrl();

const DevicesTab: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceColors, setDeviceColors] = useState<Record<number, RGB>>({});

  // Fetch devices list
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const endpoint = `${API_BASE_URL}/device`;
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setDevices(data.devices || []);

        // initialize device colors
        const initialColors: Record<number, RGB> = {};
        (data.devices || []).forEach((d: Device) => {
          initialColors[d.id] = { r: 255, g: 255, b: 255 }; // default white
        });
        setDeviceColors(initialColors);
      } catch (error) {
        console.error("Failed to fetch devices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // ======================
  // Base action function
  // ======================
  const sendAction = async (deviceId: number, action: string, actionBody: object = {}) => {
    // Build endpoint: /device/id/{id}/action
    const endpoint = `${API_BASE_URL}/device/id/${deviceId}/action`;

    // Build request body: { action: "...", body: {...} }
    const requestBody = {
      action: action,
      body: actionBody
    };

    try {
      const json = JSON.stringify(requestBody);
      console.log("Request: ", json);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
      });
      if (!response.ok) throw new Error(`Action ${action} failed: ${response.status}`);
      const responseData = await response.json();
      console.log(`✅ ${action.toUpperCase()} action successful for device ${deviceId}`, responseData);
      return responseData;
    } catch (error) {
      console.error(`❌ Failed to perform ${action} on device ${deviceId}:`, error);
      return null;
    }
  };

  // ======================
  // Action functions
  // ======================
  const toggleDevice = (id: number) => sendAction(id, "toggle");
  const turnOnDevice = (id: number) => sendAction(id, "on");
  const turnOffDevice = (id: number) => sendAction(id, "off");

  const setDeviceRGB = (id: number, r: number, g: number, b: number) => {
    sendAction(id, "set_rgb", { r, g, b });

    // update local state so picker shows current color
    setDeviceColors(prev => ({ ...prev, [id]: { r, g, b } }));
  };

  const setDeviceBrightness = (id: number, brightness: number) => {
    sendAction(id, "set_brightness", { brightness });
  };

  // ======================
  // Render
  // ======================
  if (loading) return <Typography>Loading devices...</Typography>;
  if (devices.length === 0) return <Typography>No devices found.</Typography>;

  return (
    <Grid container spacing={3} {...({} as any)}>
      {devices.map((device) => {
        const currentColor = deviceColors[device.id] || { r: 255, g: 255, b: 255 };
        return (
        <Grid item xs={12} sm={6} md={4} key={device.id} {...({} as any)}>
          <Card
            sx={{
              backgroundColor: "#f9f9f9",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              borderRadius: "10px",
              overflow: "visible", // needed for SketchPicker
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" color="primary" gutterBottom>
                  {device.name || `Device ${device.id}`}
                </Typography>
                <Chip
                  label={device.status}
                  color={device.status === "online" ? "success" : "error"}
                  size="small"
                />
              </Box>
              <Typography variant="body2">Type: {device.type}</Typography>
              <Typography variant="body2">IP: {device.ip}</Typography>
              <Typography variant="body2">Port: {device.port}</Typography>

              <Box mt={2}>
                {device.capabilities.includes("toggle") && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={{ marginRight: "8px", marginBottom: "8px" }}
                    onClick={() => toggleDevice(device.id)}
                  >
                    Toggle
                  </Button>
                )}
                {device.capabilities.includes("on") && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    sx={{ marginRight: "8px", marginBottom: "8px" }}
                    onClick={() => turnOnDevice(device.id)}
                  >
                    On
                  </Button>
                )}
                {device.capabilities.includes("off") && (
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    sx={{ marginRight: "8px", marginBottom: "8px" }}
                    onClick={() => turnOffDevice(device.id)}
                  >
                    Off
                  </Button>
                )}
                {device.capabilities.includes("set_rgb") && (
                  <Box mt={2}>
                    <Typography variant="body2" gutterBottom>
                      Set RGB Color:
                    </Typography>
                    <input
                      type="color"
                      value={`#${currentColor.r.toString(16).padStart(2, '0')}${currentColor.g.toString(16).padStart(2, '0')}${currentColor.b.toString(16).padStart(2, '0')}`}
                      onChange={(e) => {
                        const hex = e.target.value;
                        const r = parseInt(hex.slice(1, 3), 16);
                        const g = parseInt(hex.slice(3, 5), 16);
                        const b = parseInt(hex.slice(5, 7), 16);
                        setDeviceRGB(device.id, r, g, b);
                      }}
                      style={{
                        width: "100%",
                        height: "40px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    />
                  </Box>
                )}
                {device.capabilities.includes("set_brightness") && (
                  <Box mt={2}>
                    <Typography variant="body2" gutterBottom>
                      Set Brightness:
                    </Typography>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="50"
                      style={{ width: "100%" }}
                      onChange={(e) => setDeviceBrightness(device.id, parseInt(e.target.value))}
                    />
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        );
      })}
    </Grid>
  );
};

export default DevicesTab;
