import React, { useMemo, useCallback, useState } from "react";
import {
  Card,
  Typography,
  Box,
  Chip,
  Stack,
} from "@mui/material";

import PowerIcon from "@mui/icons-material/Power";
import PaletteIcon from "@mui/icons-material/Palette";
import DevicesIcon from "@mui/icons-material/Devices";

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

interface EventsTabProps {
  events: EventMessage[];
  connected: boolean;
}

const EventsTab: React.FC<EventsTabProps> = ({ events, connected }) => {
  const [wsError] = useState<string | null>(null);

  const getEventIcon = useCallback((eventName: string) => {
    if (eventName.includes("Connected")) return <DevicesIcon />;
    if (eventName.includes("State")) return <PowerIcon />;
    if (eventName.includes("Color")) return <PaletteIcon />;
    return <DevicesIcon />;
  }, []);

  const getEventColor = useCallback((eventName: string) => {
    if (eventName.includes("Connected")) return "#34d399";
    if (eventName.includes("State")) return "#60a5fa";
    if (eventName.includes("Color")) return "#a78bfa";
    return "#9ca3af";
  }, []);

  const formatEventBody = useCallback((event: EventMessage) => {
    const { body } = event;
    
    if (event.name === "DeviceConnectedEvent") {
      return `Device ${body.device.ip} connected`;
    }
    
    if (event.name === "DeviceChangedStateEvent") {
      return `Device ${body.device.ip} turned ${body.enabled ? "ON" : "OFF"}`;
    }
    
    if (event.name === "DeviceChangedColorEvent") {
      const color = `rgb(${body.r}, ${body.g}, ${body.b})`;
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <span>Device {body.device.ip} color changed to</span>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: "4px",
              backgroundColor: color,
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          />
          <span style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{color}</span>
        </Box>
      );
    }
    
    return JSON.stringify(body);
  }, []);

  const renderedEvents = useMemo(() => {
    return events.map((event, index) => (
      <Card
        key={index}
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid",
          borderColor: "divider",
          background: "linear-gradient(135deg, rgba(30, 30, 40, 0.4) 0%, rgba(20, 20, 30, 0.2) 100%)",
          overflow: "hidden",
          transition: "all 0.2s",
          "&:hover": {
            transform: "translateX(4px)",
            borderColor: getEventColor(event.name),
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            borderLeft: `4px solid ${getEventColor(event.name)}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: getEventColor(event.name),
            }}
          >
            {getEventIcon(event.name)}
          </Box>
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "monospace",
                  fontSize: "0.7rem",
                }}
              >
                {event.timestamp}
              </Typography>
              <Chip
                label={event.name.replace("Device", "").replace("Event", "")}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  backgroundColor: `${getEventColor(event.name)}20`,
                  color: getEventColor(event.name),
                  border: `1px solid ${getEventColor(event.name)}40`,
                }}
              />
              <Chip
                label={event.severity}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
                color={event.severity === "error" ? "error" : "default"}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: "#fff",
                fontSize: "0.9rem",
              }}
            >
              {formatEventBody(event)}
            </Typography>
          </Box>
        </Box>
      </Card>
    ));
  }, [events, getEventIcon, getEventColor, formatEventBody]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography 
          variant="h5" 
          fontWeight={800}
          sx={{ 
            letterSpacing: "-0.02em",
            color: "text.primary"
          }}
        >
          Events
        </Typography>
        <Chip 
          label={connected ? "Connected" : "Disconnected"} 
          color={connected ? "success" : "error"}
          size="small"
        />
      </Box>

      {events.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            p: 4,
            textAlign: "center",
          }}
        >
          <Typography variant="body1" color="text.secondary">
            {wsError ? `Error: ${wsError}` : connected ? "Waiting for events..." : "Not connected to event stream"}
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {renderedEvents}
        </Stack>
      )}
    </Box>
  );
};

export default EventsTab;
