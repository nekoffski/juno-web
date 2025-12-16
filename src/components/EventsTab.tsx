import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Stack,
} from "@mui/material";

import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import ReportIcon from "@mui/icons-material/Report";

interface EventMessage {
  name: string;
  message: string;
  severity: string;
  timestamp: string;
  body?: any;
}

const WS_HOST = "localhost";
const WS_PORT = 9001;

const EventsTab: React.FC = () => {
  const [events, setEvents] = useState<EventMessage[]>([]);

  useEffect(() => {
    const wsUrl = `ws://${WS_HOST}:${WS_PORT}`;
    console.log(`Connecting to ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    let buffer = "";

    ws.onopen = () => {
      console.log("✅ Connected to Kafka WebSocket gateway");
    };

    ws.onmessage = (event) => {
      buffer += event.data;

      // Split by newline (since multiple messages can arrive in a single frame)
      const parts = buffer.split("\n");
      buffer = parts.pop() || ""; // keep any incomplete data

      for (const line of parts) {
        if (line.trim() === "") continue;

        try {
          const data = JSON.parse(line);
          const newEvent: EventMessage = {
            name: data.name,
            message: data.message,
            severity: data.severity,
            body: data.body,
            timestamp: new Date().toLocaleTimeString(),
          };

          console.log("📥 Event received:", newEvent);

          setEvents((prev) => [newEvent, ...prev]); // prepend latest
        } catch (err) {
          console.error("❌ Failed to parse message:", err, line);
        }
      }
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
    };

    ws.onclose = () => {
      console.warn("⚠️ WebSocket connection closed");
    };

    return () => {
      ws.close();
    };
  }, []);

  const getIcon = (severity: string) => {
    switch (severity) {
      case "info":
        return <InfoIcon color="info" />;
      case "warning":
        return <WarningIcon color="warning" />;
      case "error":
        return <ErrorIcon color="error" />;
      case "fatal":
        return <ReportIcon color="error" />;
      default:
        return <InfoIcon />;
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        System Events
      </Typography>

      {events.length === 0 ? (
        <Typography variant="body1">No events yet...</Typography>
      ) : (
        events.map((ev, index) => (
          <Card
            key={index}
            sx={{
              mb: 2,
              borderLeft: `6px solid ${
                ev.severity === "error"
                  ? "#f44336"
                  : ev.severity === "warning"
                  ? "#ff9800"
                  : ev.severity === "fatal"
                  ? "#b71c1c"
                  : "#2196f3"
              }`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                {getIcon(ev.severity)}
                <Box>
                  <Typography variant="subtitle1">
                    [{ev.timestamp}] {ev.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {ev.message}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
            <Divider />
          </Card>
        ))
      )}
    </Box>
  );
};

export default EventsTab;
