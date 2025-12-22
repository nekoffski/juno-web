import React, { useState, useMemo, useEffect, useCallback } from "react";
import { CssBaseline, Container, Typography, ThemeProvider, createTheme, useMediaQuery, IconButton, Box, Snackbar, Alert } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Tabs from "./components/Tabs";
import DevicesTab from "./components/DevicesTab";
import MetricsTab from "./components/MetricsTab";
import EventsTab from "./components/EventsTab";
import RulesTab from "./components/RulesTab";

interface Device {
  id: number;
  ip: string;
  name: string;
  port: number;
}

interface EventMessage {
  name: string;
  category: string;
  severity: string;
  body: {
    device: Device;
    enabled?: boolean;
    r?: number;
    g?: number;
    b?: number;
  };
  timestamp?: string;
}

// Read from environment variables
const WS_PORT = 6010;

const getWebSocketUrl = () => {
  let host = process.env.REACT_APP_JUNO_PROXY || "REACT_APP_JUNO_PROXY_PLACEHOLDER";
  // Replace 0.0.0.0 with localhost for browser compatibility
  if (host === '0.0.0.0') {
    host = 'localhost';
  }
  
  return `ws://${host}:${WS_PORT}`;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("devices");
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>(prefersDarkMode ? 'dark' : 'light');
  const [events, setEvents] = useState<EventMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "info" | "success" | "warning" | "error";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const showNotification = useCallback((event: EventMessage) => {
    let message = "";
    let severity: "info" | "success" | "warning" | "error" = "info";

    if (event.name === "DeviceConnectedEvent") {
      message = `Device ${event.body.device.ip} connected`;
      severity = "success";
    } else if (event.name === "DeviceChangedStateEvent") {
      message = `Device ${event.body.device.ip} turned ${event.body.enabled ? "ON" : "OFF"}`;
      severity = "info";
    } else if (event.name === "DeviceChangedColorEvent") {
      message = `Device ${event.body.device.ip} color changed`;
      severity = "info";
    }

    setNotification({ open: true, message, severity });
  }, []);

  const handleCloseNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  // WebSocket connection at app level
  useEffect(() => {
    const wsUrl = getWebSocketUrl();
    console.log(`[App] Connecting to WebSocket: ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);
    let buffer = "";

    ws.onopen = () => {
      console.log("✅ [App] WebSocket connected successfully");
      setConnected(true);
    };

    ws.onmessage = (event) => {
      buffer += event.data;
      const parts = buffer.split("\n");
      buffer = parts.pop() || "";

      for (const line of parts) {
        if (line.trim() === "") continue;

        try {
          const data = JSON.parse(line);
          const newEvent: EventMessage = {
            ...data,
            timestamp: new Date().toLocaleTimeString(),
          };

          console.log("✅ [App] Event received:", newEvent);
          setEvents((prev) => [newEvent, ...prev].slice(0, 100));
          showNotification(newEvent);
        } catch (err) {
          console.error("❌ [App] Failed to parse message:", err);
        }
      }
    };

    ws.onerror = (err) => {
      console.error("❌ [App] WebSocket error:", err);
      setConnected(false);
    };

    ws.onclose = (event) => {
      console.warn("⚠️ [App] WebSocket connection closed. Code:", event.code);
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [showNotification]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ padding: "20px" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" align="center" sx={{ flexGrow: 1 }}>
            Juno Dashboard
          </Typography>
          <IconButton onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} color="inherit">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeTab === "devices" && <DevicesTab />}
        {activeTab === "metrics" && <MetricsTab />}
        {activeTab === "events" && <EventsTab events={events} connected={connected} />}
        {activeTab === "rules" && <RulesTab />}
      </Container>

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default App;