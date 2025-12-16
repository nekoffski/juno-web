import React, { useState } from "react";
import { CssBaseline, Container, Typography } from "@mui/material";
import Tabs from "./components/Tabs";
import DevicesTab from "./components/DevicesTab";
import EventsTab from "./components/EventsTab";
import RulesTab from "./components/RulesTab";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("devices");

  return (
    <Container maxWidth="lg" sx={{ padding: "20px" }}>
      <CssBaseline />
      <Typography variant="h3" align="center" gutterBottom>
        Smart Home Dashboard
      </Typography>
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === "devices" && <DevicesTab />}
      {activeTab === "events" && <EventsTab />}
      {activeTab === "rules" && <RulesTab />}
    </Container>
  );
};

export default App;