import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Checkbox
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

interface Device {
  id: number;
  name: string;
  type: string;
  capabilities: string[];
}

interface DeviceGroup {
  id?: number;
  name: string;
  devices: number[];
  capabilities: string[];
}

interface GroupManagementDialogProps {
  open: boolean;
  editingGroup: DeviceGroup | null;
  devices: Device[];
  onClose: () => void;
  onSave: (group: DeviceGroup) => Promise<void>;
  onDelete?: (groupId: number) => Promise<void>;
  apiBaseUrl: string;
}

const GroupManagementDialog: React.FC<GroupManagementDialogProps> = ({
  open,
  editingGroup,
  devices,
  onClose,
  onSave,
  onDelete,
  apiBaseUrl
}) => {
  const [groupName, setGroupName] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get common capabilities from selected devices
  const getCommonCapabilities = (deviceIds: number[]): string[] => {
    if (deviceIds.length === 0) return [];
    
    const deviceCapabilities = deviceIds.map(id => {
      const device = devices.find(d => d.id === id);
      return device?.capabilities || [];
    });

    // Find common capabilities
    if (deviceCapabilities.length === 0) return [];
    
    const common = deviceCapabilities[0].filter(cap =>
      deviceCapabilities.every(caps => caps.includes(cap))
    );

    return common;
  };

  useEffect(() => {
    if (editingGroup) {
      setGroupName(editingGroup.name);
      setSelectedDevices(new Set(editingGroup.devices));
    } else {
      setGroupName("");
      setSelectedDevices(new Set());
    }
    setError(null);
  }, [open, editingGroup]);

  const commonCapabilities = getCommonCapabilities(Array.from(selectedDevices));

  const handleDeviceToggle = (deviceId: number) => {
    const newSelection = new Set(selectedDevices);
    if (newSelection.has(deviceId)) {
      newSelection.delete(deviceId);
    } else {
      newSelection.add(deviceId);
    }
    setSelectedDevices(newSelection);
  };

  const handleSave = async () => {
    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }

    if (selectedDevices.size === 0) {
      setError("At least one device must be selected");
      return;
    }

    setLoading(true);
    try {
      const calculatedCapabilities = getCommonCapabilities(Array.from(selectedDevices));
      const groupData: DeviceGroup = {
        id: editingGroup?.id,
        name: groupName.trim(),
        devices: Array.from(selectedDevices),
        capabilities: calculatedCapabilities
      };

      onSave(groupData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save group");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingGroup?.id) return;

    if (!window.confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
      return;
    }

    setLoading(true);
    try {
      onDelete?.(editingGroup.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingGroup ? "Edit Group" : "Create New Group"}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Group Name */}
        <TextField
          fullWidth
          label="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="e.g., Living Room"
          disabled={loading}
          sx={{ mb: 3 }}
        />

        {/* Device Selection */}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          Select Devices ({selectedDevices.size} selected)
        </Typography>
        <Paper variant="outlined" sx={{ mb: 3, maxHeight: 250, overflow: "auto" }}>
          <List sx={{ py: 0 }}>
            {devices.map((device, index) => (
              <React.Fragment key={device.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    role={undefined}
                    onClick={() => handleDeviceToggle(device.id)}
                    dense
                    disabled={loading}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedDevices.has(device.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={device.name}
                      secondary={`${device.type} • ${device.capabilities.length} capabilities`}
                    />
                  </ListItemButton>
                </ListItem>
                {index < devices.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* Calculated Capabilities (Read-only) */}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          Common Capabilities
        </Typography>
        {selectedDevices.size === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Select at least one device to see available capabilities
          </Alert>
        ) : (
          <Paper variant="outlined" sx={{ mb: 2, p: 2, backgroundColor: "background.default" }}>
            {commonCapabilities.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No common capabilities across selected devices
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={1}>
                {commonCapabilities.map((capability) => (
                  <Typography key={capability} variant="body2" sx={{ py: 0.5 }}>
                    • {capability.replace(/_/g, " ")}
                  </Typography>
                ))}
              </Box>
            )}
          </Paper>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {editingGroup && onDelete && (
          <Button
            onClick={handleDelete}
            color="error"
            startIcon={<DeleteIcon />}
            disabled={loading}
            sx={{ mr: "auto" }}
          >
            Delete
          </Button>
        )}
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || selectedDevices.size === 0}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? "Saving..." : editingGroup ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupManagementDialog;
