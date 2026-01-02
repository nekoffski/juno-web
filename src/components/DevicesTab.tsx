import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Chip, Grid, Popover, IconButton, Slider, Button } from "@mui/material";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import BrightnessHighIcon from "@mui/icons-material/BrightnessHigh";
import PaletteIcon from "@mui/icons-material/Palette";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import GroupManagementDialog from "./GroupManagementDialog";

interface Device {
  id: number;
  name: string;
  type: string;
  ip: string;
  port: number;
  status: string;
  capabilities: string[];
  is_on?: boolean;
  rgb?: RGB;
  brightness?: number;
}

interface DeviceGroup {
  id?: number;
  name: string;
  devices: number[];
  capabilities: string[];
}

interface GroupWithState extends DeviceGroup {
  id: number;
  is_on?: boolean;
  rgb?: RGB;
  brightness?: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

// Read from environment variables (must use REACT_APP_ prefix for CRA)
const API_PORT = 6610;

const getApiBaseUrl = () => {
  let host = process.env.REACT_APP_JUNO_PROXY || "REACT_APP_JUNO_PROXY_PLACEHOLDER";
  // Replace 0.0.0.0 with localhost for browser compatibility
  if (host === '0.0.0.0') {
    host = 'localhost';
  }
  return `http://${host}:${API_PORT}/juno-device-connector`;
};

const API_BASE_URL = getApiBaseUrl();

const DevicesTab: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [groups, setGroups] = useState<GroupWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [brightnessAnchor, setBrightnessAnchor] = useState<{ el: HTMLElement; deviceId?: number; groupId?: number } | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DeviceGroup | null>(null);

  // Get device state using actions
  const getDeviceState = async (deviceId: number, action: string) => {
    const result = await sendAction(deviceId, action, {});
    return result;
  };

  // Fetch devices list and their states
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const endpoint = `${API_BASE_URL}/device`;
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const deviceList = data.devices || [];

        // Fetch state for each device using actions
        const devicesWithState = await Promise.all(
          deviceList.map(async (device: Device) => {
            let is_on = undefined;
            let rgb = undefined;
            let brightness = undefined;

            // Get power state if device supports it
            if (device.capabilities.includes("power")) {
              const powerResult = await getDeviceState(device.id, "power");
              is_on = powerResult?.body?.enabled;
            }

            // Get RGB if device supports it
            if (device.capabilities.includes("get_rgb")) {
              const rgbResult = await getDeviceState(device.id, "get_rgb");
              const rgbData = rgbResult?.body;
              if (rgbData) {
                rgb = { r: rgbData.r, g: rgbData.g, b: rgbData.b };
              }
            }

            // Get brightness if device supports it
            if (device.capabilities.includes("get_brightness")) {
              const brightnessResult = await getDeviceState(device.id, "get_brightness");
              brightness = brightnessResult?.body?.brightness;
            }

            return {
              ...device,
              is_on,
              rgb,
              brightness
            };
          })
        );

        setDevices(devicesWithState);

        // Fetch groups
        const groupsEndpoint = `${API_BASE_URL}/device/group`;
        const groupsResponse = await fetch(groupsEndpoint);
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          const groupsArray: GroupWithState[] = [];
          
          // Convert groups object to array
          if (groupsData.groups) {
            for (const [groupId, groupInfo] of Object.entries(groupsData.groups)) {
              const group = groupInfo as any;
              groupsArray.push({
                id: parseInt(groupId),
                name: group.name,
                devices: group.devices || [],
                capabilities: group.capabilities || []
              });
            }
          }
          
          // Fetch state for each group
          const groupsWithState = await Promise.all(
            groupsArray.map(async (group) => {
              let is_on = undefined;
              let rgb = undefined;
              let brightness = undefined;

              // Get power state if group supports it
              if (group.capabilities.includes("toggle")) {
                const powerResult = await sendGroupAction(group.id, "power", {});
                is_on = powerResult?.responses?.[0]?.body?.enabled;
              }

              // Get RGB if group supports it
              if (group.capabilities.includes("set_rgb")) {
                const rgbResult = await sendGroupAction(group.id, "get_rgb", {});
                const rgbData = rgbResult?.responses?.[0]?.body;
                if (rgbData) {
                  rgb = { r: rgbData.r, g: rgbData.g, b: rgbData.b };
                }
              }

              // Get brightness if group supports it
              if (group.capabilities.includes("set_brightness")) {
                const brightnessResult = await sendGroupAction(group.id, "get_brightness", {});
                brightness = brightnessResult?.responses?.[0]?.body?.brightness;
              }

              return {
                ...group,
                is_on,
                rgb,
                brightness
              };
            })
          );
          
          setGroups(groupsWithState);
        }
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
  // Group action function
  // ======================
  const sendGroupAction = async (groupId: number, action: string, actionBody: object = {}) => {
    // Build endpoint: /device/group/id/{id}/action
    const endpoint = `${API_BASE_URL}/device/group/id/${groupId}/action`;

    // Build request body: { action: "...", body: {...} }
    const requestBody = {
      action: action,
      body: actionBody
    };

    try {
      const json = JSON.stringify(requestBody);
      console.log("Group Request: ", json);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
      });
      if (!response.ok) throw new Error(`Action ${action} failed: ${response.status}`);
      const responseData = await response.json();
      console.log(`✅ ${action.toUpperCase()} action successful for group ${groupId}`, responseData);
      return responseData;
    } catch (error) {
      console.error(`❌ Failed to perform ${action} on group ${groupId}:`, error);
      return null;
    }
  };

  // ======================
  // Action functions
  // ======================
  const toggleDevice = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await sendAction(id, "toggle");
    // Fetch updated power state
    const powerResult = await sendAction(id, "power", {});
    if (powerResult?.body) {
      setDevices(prev => prev.map(d => 
        d.id === id ? { ...d, is_on: powerResult.body.enabled } : d
      ));
    }
  };

  const setDeviceRGB = async (id: number, r: number, g: number, b: number) => {
    await sendAction(id, "set_rgb", { r, g, b });

    // Fetch updated RGB state
    const rgbResult = await sendAction(id, "get_rgb", {});
    if (rgbResult?.body) {
      const rgbData = rgbResult.body;
      setDevices(prev => prev.map(d => 
        d.id === id ? { ...d, rgb: { r: rgbData.r, g: rgbData.g, b: rgbData.b } } : d
      ));
    }
  };

  const setDeviceBrightness = async (id: number, brightness: number) => {
    await sendAction(id, "set_brightness", { brightness });
    
    // Fetch updated brightness state
    const brightnessResult = await sendAction(id, "get_brightness", {});
    if (brightnessResult?.body) {
      setDevices(prev => prev.map(d => 
        d.id === id ? { ...d, brightness: brightnessResult.body.brightness } : d
      ));
    }
  };

  // Group action functions
  const toggleGroup = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await sendGroupAction(id, "toggle");
    // Fetch updated power state
    const powerResult = await sendGroupAction(id, "power", {});
    if (powerResult?.responses?.[0]?.body) {
      setGroups(prev => prev.map(g => 
        g.id === id ? { ...g, is_on: powerResult.responses[0].body.enabled } : g
      ));
    }
  };

  const setGroupRGB = async (id: number, r: number, g: number, b: number) => {
    await sendGroupAction(id, "set_rgb", { r, g, b });

    // Fetch updated RGB state
    const rgbResult = await sendGroupAction(id, "get_rgb", {});
    if (rgbResult?.responses?.[0]?.body) {
      const rgbData = rgbResult.responses[0].body;
      setGroups(prev => prev.map(g => 
        g.id === id ? { ...g, rgb: { r: rgbData.r, g: rgbData.g, b: rgbData.b } } : g
      ));
    }
  };

  const setGroupBrightness = async (id: number, brightness: number) => {
    await sendGroupAction(id, "set_brightness", { brightness });
    
    // Fetch updated brightness state
    const brightnessResult = await sendGroupAction(id, "get_brightness", {});
    if (brightnessResult?.responses?.[0]?.body) {
      setGroups(prev => prev.map(g => 
        g.id === id ? { ...g, brightness: brightnessResult.responses[0].body.brightness } : g
      ));
    }
  };

  const handleBrightnessClick = (e: React.MouseEvent<HTMLElement>, deviceId?: number, groupId?: number) => {
    e.stopPropagation();
    setBrightnessAnchor({ el: e.currentTarget, deviceId, groupId });
  };

  const handleClosePopovers = () => {
    setBrightnessAnchor(null);
  };

  // ======================
  // Group Management
  // ======================
  const handleOpenGroupDialog = (group?: GroupWithState) => {
    if (group) {
      setEditingGroup({
        id: group.id,
        name: group.name,
        devices: group.devices,
        capabilities: group.capabilities
      });
    } else {
      setEditingGroup(null);
    }
    setGroupDialogOpen(true);
  };

  const handleCloseGroupDialog = () => {
    setGroupDialogOpen(false);
    setEditingGroup(null);
  };

  const handleSaveGroup = async (groupData: DeviceGroup) => {
    try {
      if (groupData.id) {
        // Update existing group
        const endpoint = `${API_BASE_URL}/device/group/id/${groupData.id}`;
        const response = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: groupData.name,
            devices: groupData.devices
          })
        });
        if (!response.ok) throw new Error(`Failed to update group: ${response.status}`);
        
        // Fetch updated group to get capabilities
        const getResponse = await fetch(`${API_BASE_URL}/device/group/id/${groupData.id}`);
        if (getResponse.ok) {
          const updatedGroup = await getResponse.json();
          setGroups(prev => prev.map(g => 
            g.id === groupData.id 
              ? {
                  ...g,
                  name: updatedGroup.name,
                  devices: updatedGroup.devices,
                  capabilities: updatedGroup.capabilities
                }
              : g
          ));
        }
      } else {
        // Create new group
        const endpoint = `${API_BASE_URL}/device/group`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: groupData.name,
            devices: groupData.devices
          })
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create group: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        
        // Fetch initial state for the new group
        let is_on = undefined;
        let rgb = undefined;
        let brightness = undefined;
        const capabilities = data.capabilities || [];

        if (capabilities.includes("toggle")) {
          const powerResult = await sendGroupAction(data.id, "power", {});
          is_on = powerResult?.responses?.[0]?.body?.enabled;
        }

        if (capabilities.includes("set_rgb")) {
          const rgbResult = await sendGroupAction(data.id, "get_rgb", {});
          const rgbData = rgbResult?.responses?.[0]?.body;
          if (rgbData) {
            rgb = { r: rgbData.r, g: rgbData.g, b: rgbData.b };
          }
        }

        if (capabilities.includes("set_brightness")) {
          const brightnessResult = await sendGroupAction(data.id, "get_brightness", {});
          brightness = brightnessResult?.responses?.[0]?.body?.brightness;
        }

        // Add to local state with server-calculated capabilities and state
        const newGroup: GroupWithState = {
          id: data.id,
          name: groupData.name,
          devices: groupData.devices,
          capabilities: capabilities,
          is_on,
          rgb,
          brightness
        };
        setGroups(prev => [...prev, newGroup]);
      }
      
      handleCloseGroupDialog();
      console.log("✅ Group saved successfully");
    } catch (error) {
      console.error("❌ Failed to save group:", error);
      alert(`Failed to save group: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    try {
      const endpoint = `${API_BASE_URL}/device/group/id/${groupId}`;
      const response = await fetch(endpoint, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error(`Failed to delete group: ${response.status}`);
      
      // Remove from local state
      setGroups(prev => prev.filter(g => g.id !== groupId));
      handleCloseGroupDialog();
      console.log("✅ Group deleted successfully");
    } catch (error) {
      console.error("❌ Failed to delete group:", error);
      alert(`Failed to delete group: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // ======================
  // Render
  // ======================
  if (loading) return <Typography>Loading devices...</Typography>;

  const brightnessDevice = brightnessAnchor?.deviceId ? devices.find(d => d.id === brightnessAnchor.deviceId) : null;
  const brightnessGroup = brightnessAnchor?.groupId ? groups.find(g => g.id === brightnessAnchor.groupId) : null;

  return (
    <>
      {/* Header with Create Group Button */}
      {devices.length > 0 && (
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            size="small"
            onClick={() => handleOpenGroupDialog()}
            sx={{ textTransform: "none" }}
          >
            Create Group
          </Button>
        </Box>
      )}

      <Grid 
        container 
        spacing={2.5} 
        sx={{ 
          width: "100%", 
          margin: 0,
          justifyContent: { xs: "center", sm: "flex-start" }
        }} 
        {...({} as any)}
      >
        {devices.map((device) => {
          const currentColor = device.rgb || { r: 255, g: 255, b: 255 };
          const hasRgb = device.capabilities.includes("set_rgb");
          const rgbColor = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;
          
          return (
            <Grid 
              item 
              xs={12} 
              sm={6} 
              md={4} 
              lg={3} 
              key={device.id}
              sx={{
                display: "flex",
                justifyContent: "center"
              }}
              {...({} as any)}
            >
              <Card
                elevation={0}
                sx={{
                  width: "100%",
                  maxWidth: { xs: "400px", sm: "100%" },
                  borderRadius: "16px",
                  overflow: "visible",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  border: "1px solid",
                  borderColor: "divider",
                  background: hasRgb 
                    ? `linear-gradient(135deg, ${rgbColor}15 0%, transparent 100%)`
                    : "background.paper",
                  position: "relative",
                  "&::before": hasRgb ? {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: `linear-gradient(90deg, ${rgbColor} 0%, ${rgbColor}80 100%)`,
                  } : {},
                  "&:hover": {
                    borderColor: "primary.main",
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  },
                }}
              >
                <CardContent sx={{ padding: "16px !important", "&:last-child": { paddingBottom: "16px !important" } }}>
                  {/* Header with name and status */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box flex={1} mr={1}>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight="700" 
                        sx={{ 
                          fontSize: "0.95rem",
                          mb: 0.25,
                          color: "text.primary"
                        }}
                      >
                        {device.name || `Device ${device.id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                        {device.type}
                      </Typography>
                    </Box>
                    <Chip
                      label={device.status === "online" ? "online" : "offline"}
                      color={device.status === "online" ? "success" : "error"}
                      size="small"
                      sx={{ 
                        height: "22px", 
                        fontSize: "0.65rem", 
                        fontWeight: 600,
                        textTransform: "capitalize"
                      }}
                    />
                  </Box>

                  {/* Interactive Controls */}
                  <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
                    {/* Power Toggle Button */}
                    {device.capabilities.includes("toggle") && (
                      <IconButton
                        onClick={(e) => toggleDevice(device.id, e)}
                        sx={{
                          backgroundColor: device.is_on ? "success.main" : "grey.300",
                          color: "white",
                          "&:hover": {
                            backgroundColor: device.is_on ? "success.dark" : "grey.400",
                          },
                          width: 44,
                          height: 44,
                          transition: "all 0.3s"
                        }}
                      >
                        <PowerSettingsNewIcon fontSize="small" />
                      </IconButton>
                    )}

                    {/* Color Picker Button */}
                    {hasRgb && (
                      <Box sx={{ position: "relative" }}>
                        <input
                          type="color"
                          value={`#${(currentColor.r || 255).toString(16).padStart(2, '0')}${(currentColor.g || 255).toString(16).padStart(2, '0')}${(currentColor.b || 255).toString(16).padStart(2, '0')}`}
                          onChange={(e) => {
                            const hex = e.target.value;
                            const r = parseInt(hex.slice(1, 3), 16);
                            const g = parseInt(hex.slice(3, 5), 16);
                            const b = parseInt(hex.slice(5, 7), 16);
                            setDeviceRGB(device.id, r, g, b);
                          }}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "44px",
                            height: "44px",
                            opacity: 0,
                            cursor: "pointer",
                            zIndex: 10
                          }}
                        />
                        <IconButton
                          sx={{
                            backgroundColor: rgbColor,
                            border: "2px solid",
                            borderColor: "divider",
                            "&:hover": {
                              transform: "scale(1.05)",
                              boxShadow: `0 4px 12px ${rgbColor}60`
                            },
                            width: 44,
                            height: 44,
                            transition: "all 0.3s",
                            pointerEvents: "none"
                          }}
                        >
                          <PaletteIcon fontSize="small" sx={{ color: "white", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />
                        </IconButton>
                      </Box>
                    )}

                    {/* Brightness Control Button */}
                    {device.capabilities.includes("set_brightness") && (
                      <IconButton
                        onClick={(e) => handleBrightnessClick(e, device.id)}
                        sx={{
                          backgroundColor: "rgba(102, 126, 234, 0.1)",
                          border: "2px solid",
                          borderColor: "rgba(102, 126, 234, 0.3)",
                          color: "#667eea",
                          "&:hover": {
                            backgroundColor: "rgba(102, 126, 234, 0.2)",
                            transform: "scale(1.05)"
                          },
                          width: 44,
                          height: 44,
                          transition: "all 0.3s"
                        }}
                      >
                        <BrightnessHighIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  {/* Status Info */}
                  <Box mt={1.5} display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    {device.is_on !== undefined && (
                      <Chip
                        label={device.is_on ? "ON" : "OFF"}
                        size="small"
                        sx={{
                          height: "20px",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          backgroundColor: device.is_on ? "rgba(16, 185, 129, 0.15)" : "rgba(0, 0, 0, 0.08)",
                          color: device.is_on ? "#10b981" : "text.secondary"
                        }}
                      />
                    )}
                    {device.brightness !== undefined && (
                      <Chip
                        label={`${device.brightness}%`}
                        size="small"
                        icon={<span style={{ fontSize: "0.75rem" }}>☀</span>}
                        sx={{
                          height: "20px",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          backgroundColor: "rgba(102, 126, 234, 0.1)",
                          color: "#667eea"
                        }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Groups Section */}
      {groups.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
            Groups
          </Typography>
          <Grid 
            container 
            spacing={2.5} 
            sx={{ 
              width: "100%", 
              margin: 0,
              justifyContent: { xs: "center", sm: "flex-start" }
            }} 
            {...({} as any)}
          >
            {groups.map((group) => {
              const currentColor = group.rgb || { r: 255, g: 255, b: 255 };
              const hasRgb = group.capabilities.includes("set_rgb");
              const rgbColor = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;
              
              return (
                <Grid 
                  item 
                  xs={12} 
                  sm={6} 
                  md={4} 
                  lg={3} 
                  key={`group-${group.id}`}
                  sx={{
                    display: "flex",
                    justifyContent: "center"
                  }}
                  {...({} as any)}
                >
                  <Card
                    elevation={0}
                    sx={{
                      width: "100%",
                      maxWidth: { xs: "400px", sm: "100%" },
                      borderRadius: "16px",
                      overflow: "visible",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      border: "2px dashed",
                      borderColor: "primary.main",
                      background: hasRgb 
                        ? `linear-gradient(135deg, ${rgbColor}15 0%, transparent 100%)`
                        : "background.paper",
                      position: "relative",
                      "&::before": hasRgb ? {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "3px",
                        background: `linear-gradient(90deg, ${rgbColor} 0%, ${rgbColor}80 100%)`,
                      } : {},
                      "&:hover": {
                        borderColor: "primary.light",
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      },
                    }}
                  >
                    <CardContent sx={{ padding: "16px !important", "&:last-child": { paddingBottom: "16px !important" } }}>
                      {/* Header with name and device count */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Box flex={1} mr={1}>
                          <Typography 
                            variant="subtitle1" 
                            fontWeight="700" 
                            sx={{ 
                              fontSize: "0.95rem",
                              mb: 0.25,
                              color: "text.primary"
                            }}
                          >
                            {group.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                            {group.devices.length} device{group.devices.length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={0.5} alignItems="center">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenGroupDialog(group);
                            }}
                            sx={{
                              color: "primary.main",
                              width: 32,
                              height: 32,
                              "&:hover": {
                                backgroundColor: "rgba(102, 126, 234, 0.1)"
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <Chip
                            label="Group"
                            color="primary"
                            size="small"
                            variant="outlined"
                            sx={{ 
                              height: "22px", 
                              fontSize: "0.65rem", 
                              fontWeight: 600
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Interactive Controls */}
                      <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
                        {/* Power Toggle Button */}
                        {group.capabilities.includes("toggle") && (
                          <IconButton
                            onClick={(e) => toggleGroup(group.id, e)}
                            sx={{
                              backgroundColor: group.is_on ? "success.main" : "grey.300",
                              color: "white",
                              "&:hover": {
                                backgroundColor: group.is_on ? "success.dark" : "grey.400",
                              },
                              width: 44,
                              height: 44,
                              transition: "all 0.3s"
                            }}
                          >
                            <PowerSettingsNewIcon fontSize="small" />
                          </IconButton>
                        )}

                        {/* Color Picker Button */}
                        {hasRgb && (
                          <Box sx={{ position: "relative" }}>
                            <input
                              type="color"
                              value={`#${(currentColor.r || 255).toString(16).padStart(2, '0')}${(currentColor.g || 255).toString(16).padStart(2, '0')}${(currentColor.b || 255).toString(16).padStart(2, '0')}`}
                              onChange={(e) => {
                                const hex = e.target.value;
                                const r = parseInt(hex.slice(1, 3), 16);
                                const g = parseInt(hex.slice(3, 5), 16);
                                const b = parseInt(hex.slice(5, 7), 16);
                                setGroupRGB(group.id, r, g, b);
                              }}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "44px",
                                height: "44px",
                                opacity: 0,
                                cursor: "pointer",
                                zIndex: 10
                              }}
                            />
                            <IconButton
                              sx={{
                                backgroundColor: rgbColor,
                                border: "2px solid",
                                borderColor: "divider",
                                "&:hover": {
                                  transform: "scale(1.05)",
                                  boxShadow: `0 4px 12px ${rgbColor}60`
                                },
                                width: 44,
                                height: 44,
                                transition: "all 0.3s",
                                pointerEvents: "none"
                              }}
                            >
                              <PaletteIcon fontSize="small" sx={{ color: "white", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />
                            </IconButton>
                          </Box>
                        )}

                        {/* Brightness Control Button */}
                        {group.capabilities.includes("set_brightness") && (
                          <IconButton
                            onClick={(e) => handleBrightnessClick(e, undefined, group.id)}
                            sx={{
                              backgroundColor: "rgba(102, 126, 234, 0.1)",
                              border: "2px solid",
                              borderColor: "rgba(102, 126, 234, 0.3)",
                              color: "#667eea",
                              "&:hover": {
                                backgroundColor: "rgba(102, 126, 234, 0.2)",
                                transform: "scale(1.05)"
                              },
                              width: 44,
                              height: 44,
                              transition: "all 0.3s"
                            }}
                          >
                            <BrightnessHighIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>

                      {/* Status Info */}
                      <Box mt={1.5} display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        {group.is_on !== undefined && (
                          <Chip
                            label={group.is_on ? "ON" : "OFF"}
                            size="small"
                            sx={{
                              height: "20px",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              backgroundColor: group.is_on ? "rgba(16, 185, 129, 0.15)" : "rgba(0, 0, 0, 0.08)",
                              color: group.is_on ? "#10b981" : "text.secondary"
                            }}
                          />
                        )}
                        {group.brightness !== undefined && (
                          <Chip
                            label={`${group.brightness}%`}
                            size="small"
                            icon={<span style={{ fontSize: "0.75rem" }}>☀</span>}
                            sx={{
                              height: "20px",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              backgroundColor: "rgba(102, 126, 234, 0.1)",
                              color: "#667eea"
                            }}
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Brightness Slider Popover */}
      <Popover
        open={Boolean(brightnessAnchor)}
        anchorEl={brightnessAnchor?.el}
        onClose={handleClosePopovers}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            borderRadius: "16px",
            p: 2.5,
            mt: 1,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
          }
        }}
      >
        {brightnessDevice && (
          <Box sx={{ width: 240 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2" fontWeight={700}>
                Brightness
              </Typography>
              <Typography variant="h6" fontWeight={800} color="#667eea">
                {brightnessDevice.brightness || 50}%
              </Typography>
            </Box>
            <Slider
              value={brightnessDevice.brightness || 50}
              onChange={(_, value) => setDeviceBrightness(brightnessDevice.id, value as number)}
              min={0}
              max={100}
              sx={{
                color: "#667eea",
                "& .MuiSlider-thumb": {
                  width: 20,
                  height: 20,
                  "&:hover, &.Mui-focusVisible": {
                    boxShadow: "0 0 0 8px rgba(102, 126, 234, 0.16)"
                  }
                }
              }}
            />
          </Box>
        )}
        {brightnessGroup && (
          <Box sx={{ width: 240 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2" fontWeight={700}>
                Group Brightness
              </Typography>
              <Typography variant="h6" fontWeight={800} color="#667eea">
                {brightnessGroup.brightness || 50}%
              </Typography>
            </Box>
            <Slider
              value={brightnessGroup.brightness || 50}
              onChange={(_, value) => setGroupBrightness(brightnessGroup.id, value as number)}
              min={0}
              max={100}
              sx={{
                color: "#667eea",
                "& .MuiSlider-thumb": {
                  width: 20,
                  height: 20,
                  "&:hover, &.Mui-focusVisible": {
                    boxShadow: "0 0 0 8px rgba(102, 126, 234, 0.16)"
                  }
                }
              }}
            />
          </Box>
        )}
      </Popover>

      {/* Group Management Dialog */}
      <GroupManagementDialog
        open={groupDialogOpen}
        editingGroup={editingGroup}
        devices={devices}
        onClose={handleCloseGroupDialog}
        onSave={handleSaveGroup}
        onDelete={handleDeleteGroup}
        apiBaseUrl={API_BASE_URL}
      />
    </>
  );
};

export default DevicesTab;
