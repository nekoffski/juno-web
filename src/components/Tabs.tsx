import React from "react";
import { Button, Box } from "@mui/material";

interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <Box display="flex" justifyContent="center" marginBottom="20px" flexWrap="wrap" gap={1}>
      <Button
        onClick={() => setActiveTab("devices")}
        variant={activeTab === "devices" ? "contained" : "outlined"}
        sx={{ margin: "0 5px" }}
      >
        Devices
      </Button>
      <Button
        onClick={() => setActiveTab("metrics")}
        variant={activeTab === "metrics" ? "contained" : "outlined"}
        sx={{ margin: "0 5px" }}
      >
        Metrics
      </Button>
      <Button
        onClick={() => setActiveTab("events")}
        variant={activeTab === "events" ? "contained" : "outlined"}
        sx={{ margin: "0 5px" }}
      >
        Events
      </Button>
      <Button
        onClick={() => setActiveTab("rules")}
        variant={activeTab === "rules" ? "contained" : "outlined"}
        sx={{ margin: "0 5px" }}
      >
        Rules
      </Button>
    </Box>
  );
};

export default Tabs;