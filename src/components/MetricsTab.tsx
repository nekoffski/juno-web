import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Grid } from "@mui/material";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AirIcon from "@mui/icons-material/Air";
import CompressIcon from "@mui/icons-material/Compress";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import NightsStayIcon from "@mui/icons-material/NightsStay";

interface WeatherData {
  feelsLike: number;
  humidity: number;
  maxTemp: number;
  minTemp: number;
  pressure: number;
  sunrise: number;
  sunset: number;
  temp: number;
  windSpeed: number;
}

// Read from environment variables
const getApiBaseUrl = () => {
  const host = process.env.REACT_APP_JUNO_PROXY || "REACT_APP_JUNO_PROXY_PLACEHOLDER";
  return `http://${host}/juno-metric-service`;
};

const API_BASE_URL = getApiBaseUrl();

const MetricsTab: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const endpoint = `${API_BASE_URL}/metrics/weather`;
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setWeatherData(data);
      } catch (error) {
        console.error("Failed to fetch weather data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 5 minutes
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) return <Typography>Loading metrics...</Typography>;

  return (
    <Box>
      {/* Weather Section */}
      <Typography 
        variant="h5" 
        fontWeight={800} 
        mb={3}
        sx={{ 
          letterSpacing: "-0.02em",
          color: "text.primary"
        }}
      >
        Weather
      </Typography>
      
      {weatherData && (
        <Box sx={{ width: "100%", mb: 5 }}>
          <Grid container spacing={2} sx={{ width: "100%", margin: 0 }} {...({} as any)}>
            {/* Main Temperature */}
            <Grid item xs={12} sm={6} md={3} lg={2} sx={{ display: "flex" }} {...({} as any)}>
              <Card
                elevation={0}
                sx={{
                  flex: 1,
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  background: "linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.4) 100%)",
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  }
                }}
              >
                <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, height: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 40 }}>
                    <ThermostatIcon sx={{ color: "#60a5fa", fontSize: "2rem" }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="rgba(255,255,255,0.6)" textTransform="uppercase" fontWeight={700} fontSize="0.65rem" display="block" mb={0.5}>
                      Temperature
                    </Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ color: "#fff", lineHeight: 1 }}>
                      {weatherData.temp.toFixed(1)}°
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Feels Like */}
            <Grid item xs={12} sm={6} md={3} lg={2} sx={{ display: "flex" }} {...({} as any)}>
              <Card
                elevation={0}
                sx={{
                  flex: 1,
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  background: "linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.4) 100%)",
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  }
                }}
              >
                <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, height: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 40 }}>
                    <ThermostatIcon sx={{ color: "#34d399", fontSize: "2rem" }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="rgba(255,255,255,0.6)" textTransform="uppercase" fontWeight={700} fontSize="0.65rem" display="block" mb={0.5}>
                      Feels Like
                    </Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ color: "#fff", lineHeight: 1 }}>
                      {weatherData.feelsLike.toFixed(1)}°
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Min/Max */}
            <Grid item xs={12} sm={6} md={3} lg={2} sx={{ display: "flex" }} {...({} as any)}>
              <Card
                elevation={0}
                sx={{
                  flex: 1,
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  background: "linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.4) 100%)",
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  }
                }}
              >
                <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, height: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 40 }}>
                    <ThermostatIcon sx={{ color: "#f87171", fontSize: "2rem" }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="rgba(255,255,255,0.6)" textTransform="uppercase" fontWeight={700} fontSize="0.65rem" display="block" mb={0.5}>
                      Min / Max
                    </Typography>
                    <Typography variant="h5" fontWeight={900} sx={{ color: "#fff", lineHeight: 1 }}>
                      {weatherData.minTemp.toFixed(0)}° / {weatherData.maxTemp.toFixed(0)}°
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Humidity */}
            <Grid item xs={12} sm={6} md={3} lg={2} sx={{ display: "flex" }} {...({} as any)}>
              <Card
                elevation={0}
                sx={{
                  flex: 1,
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  background: "linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.4) 100%)",
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  }
                }}
              >
                <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, height: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 40 }}>
                    <WaterDropIcon sx={{ color: "#22d3ee", fontSize: "2rem" }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="rgba(255,255,255,0.6)" textTransform="uppercase" fontWeight={700} fontSize="0.65rem" display="block" mb={0.5}>
                      Humidity
                    </Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ color: "#fff", lineHeight: 1 }}>
                      {weatherData.humidity}%
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Wind */}
            <Grid item xs={12} sm={6} md={3} lg={2} sx={{ display: "flex" }} {...({} as any)}>
              <Card
                elevation={0}
                sx={{
                  flex: 1,
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  background: "linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.4) 100%)",
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  },
                }}
              >
                <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, height: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 40 }}>
                    <AirIcon sx={{ color: "#a78bfa", fontSize: "2rem" }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="rgba(255,255,255,0.6)" textTransform="uppercase" fontWeight={700} fontSize="0.65rem" display="block" mb={0.5}>
                      Wind
                    </Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ color: "#fff", lineHeight: 1, mb: 0.25 }}>
                      {weatherData.windSpeed.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)" fontSize="0.65rem" display="block">
                      m/s
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Pressure */}
            <Grid item xs={12} sm={6} md={3} lg={2} sx={{ display: "flex" }} {...({} as any)}>
              <Card
                elevation={0}
                sx={{
                  flex: 1,
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  background: "linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.4) 100%)",
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  },
                }}
              >
                <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, height: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 40 }}>
                    <CompressIcon sx={{ color: "#fb923c", fontSize: "2rem" }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="rgba(255,255,255,0.6)" textTransform="uppercase" fontWeight={700} fontSize="0.65rem" display="block" mb={0.5}>
                      Pressure
                    </Typography>
                    <Typography variant="h5" fontWeight={900} sx={{ color: "#fff", lineHeight: 1, mb: 0.25 }}>
                      {weatherData.pressure}
                    </Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)" fontSize="0.65rem" display="block">
                      hPa
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Sunrise/Sunset */}
            <Grid item xs={12} sm={6} md={3} lg={2} sx={{ display: "flex" }} {...({} as any)}>
              <Card
                elevation={0}
                sx={{
                  flex: 1,
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  background: "linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.4) 100%)",
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  },
                }}
              >
                <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, height: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 40 }}>
                    <WbSunnyIcon sx={{ color: "#fbbf24", fontSize: "2rem" }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="rgba(255,255,255,0.6)" textTransform="uppercase" fontWeight={700} fontSize="0.65rem" display="block" mb={0.5}>
                      Sun
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={0.25}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: "#fff", lineHeight: 1.2 }}>
                        ↑ {formatTime(weatherData.sunrise)}
                      </Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: "#fff", lineHeight: 1.2 }}>
                        ↓ {formatTime(weatherData.sunset)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Home Section */}
      <Typography 
        variant="h5" 
        fontWeight={800} 
        mb={3}
        sx={{ 
          letterSpacing: "-0.02em",
          color: "text.primary"
        }}
      >
        Home
      </Typography>
      
      <Card
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
          maxWidth: { xs: "400px", sm: "100%" },
          mx: { xs: "auto", sm: 0 }
        }}
      >
        <CardContent sx={{ padding: "40px !important", textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            Coming soon...
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MetricsTab;
