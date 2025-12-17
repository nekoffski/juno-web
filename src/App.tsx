import React, { useState, useMemo } from "react";
import { CssBaseline, Container, Typography, ThemeProvider, createTheme, useMediaQuery, IconButton, Box } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Tabs from "./components/Tabs";
import DevicesTab from "./components/DevicesTab";
import MetricsTab from "./components/MetricsTab";
import EventsTab from "./components/EventsTab";
import RulesTab from "./components/RulesTab";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("devices");
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>(prefersDarkMode ? 'dark' : 'light');

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
        {activeTab === "events" && <EventsTab />}
        {activeTab === "rules" && <RulesTab />}
      </Container>
    </ThemeProvider>
  );
};

export default App;