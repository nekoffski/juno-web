import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

interface TriggerCommand {
  name: string;
  params: Record<string, any>;
}

interface TriggerBody {
  name: string;
  command: TriggerCommand;
  schedule: string;
  condition?: string;
  enabled?: boolean;
}

interface Trigger {
  id: number;
  body: TriggerBody;
  status: string;
  statusDescription: string;
}

interface TriggerCommandSpec {
  name: string;
  params: string[];
}

const API_PORT = 6610;

const getApiBaseUrl = () => {
  let host = process.env.REACT_APP_JUNO_PROXY || "REACT_APP_JUNO_PROXY_PLACEHOLDER";
  // Replace 0.0.0.0 with localhost for browser compatibility
  if (host === '0.0.0.0') {
    host = 'localhost';
  }
  return `http://${host}:${API_PORT}/juno-scheduler`;
};

const API_BASE_URL = getApiBaseUrl();

const TriggersTab: React.FC = () => {
  const [triggers, setTriggers] = useState<Record<string, Trigger>>({});
  const [commandSpecs, setCommandSpecs] = useState<TriggerCommandSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<Trigger | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<TriggerBody>({
    name: "",
    command: { name: "", params: {} },
    schedule: "",
    condition: "",
    enabled: true,
  });

  // Load triggers
  const loadTriggers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trigger`);
      if (!response.ok) throw new Error("Failed to fetch triggers");
      const data = await response.json();
      setTriggers(data.triggers || {});
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load triggers");
    } finally {
      setLoading(false);
    }
  };

  // Load available commands
  const loadCommandSpecs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trigger/commands`);
      if (!response.ok) throw new Error("Failed to fetch command specs");
      const data = await response.json();
      setCommandSpecs(data.commands || []);
    } catch (err) {
      console.error("Failed to load command specs:", err);
    }
  };

  useEffect(() => {
    loadTriggers();
    loadCommandSpecs();
  }, []);

  const handleOpenDialog = (trigger?: Trigger) => {
    if (trigger) {
      setEditingTrigger(trigger);
      setFormData(trigger.body);
    } else {
      setEditingTrigger(null);
      setFormData({
        name: "",
        command: { name: "", params: {} },
        schedule: "",
        condition: "",
        enabled: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTrigger(null);
  };

  const handleSaveTrigger = async () => {
    try {
      const payload: TriggerBody = {
        name: formData.name,
        command: formData.command,
        schedule: formData.schedule,
        enabled: formData.enabled,
      };
      
      if (formData.condition && formData.condition.trim()) {
        payload.condition = formData.condition;
      }

      if (editingTrigger) {
        // Update existing trigger
        const response = await fetch(
          `${API_BASE_URL}/trigger/id/${editingTrigger.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!response.ok) throw new Error("Failed to update trigger");
      } else {
        // Create new trigger
        const response = await fetch(`${API_BASE_URL}/trigger`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to create trigger");
      }

      await loadTriggers();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trigger");
    }
  };

  const handleDeleteTrigger = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this trigger?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/trigger/id/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete trigger");
      await loadTriggers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete trigger");
    }
  };

  // Mock enable/disable handler (API endpoints not ready yet)
  const handleToggleEnable = async (triggerId: number, currentState: boolean) => {
    // TODO: Implement when API endpoints are ready
    // const endpoint = currentState ? 'disable' : 'enable';
    // await fetch(`${API_BASE_URL}/trigger/id/${triggerId}/${endpoint}`, { method: 'POST' });
    
    // For now, just show a message
    console.log(`Toggle trigger ${triggerId} to ${!currentState ? 'enabled' : 'disabled'} (mocked)`);
    // Optionally reload triggers after implementation
    // await loadTriggers();
  };

  // Strip type annotations from parameter names (e.g., "action:str" -> "action")
  const stripTypeAnnotation = (paramName: string): string => {
    return paramName.split(':')[0];
  };

  const handleCommandChange = (commandName: string) => {
    const spec = commandSpecs.find((s) => s.name === commandName);
    const params: Record<string, any> = {};
    
    // Initialize params with empty strings, stripping type annotations
    if (spec) {
      spec.params.forEach((param) => {
        const cleanParamName = stripTypeAnnotation(param);
        params[cleanParamName] = "";
      });
    }

    setFormData({
      ...formData,
      command: { name: commandName, params },
    });
  };

  const handleParamChange = (paramName: string, value: string) => {
    // Try to parse as number if possible
    let parsedValue: any = value;
    if (value && !isNaN(Number(value))) {
      parsedValue = Number(value);
    }

    const cleanParamName = stripTypeAnnotation(paramName);

    setFormData({
      ...formData,
      command: {
        ...formData.command,
        params: {
          ...formData.command.params,
          [cleanParamName]: parsedValue,
        },
      },
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const selectedCommandSpec = commandSpecs.find((s) => s.name === formData.command.name);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Triggers</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Trigger
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {Object.keys(triggers).length === 0 ? (
        <Alert severity="info">No triggers configured yet.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Enabled</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Command</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(triggers).map((trigger) => (
                <TableRow key={trigger.id}>
                  <TableCell>
                    <Switch
                      checked={trigger.body.enabled ?? true}
                      onChange={() => handleToggleEnable(trigger.id, trigger.body.enabled ?? true)}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">{trigger.body.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{trigger.body.command.name}</Typography>
                    {Object.keys(trigger.body.command.params).length > 0 && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        {JSON.stringify(trigger.body.command.params)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{trigger.body.schedule}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {trigger.body.condition || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={trigger.status}
                      color={trigger.status === "ok" ? "success" : "error"}
                      size="small"
                    />
                    {trigger.statusDescription && (
                      <Typography variant="caption" color="error" display="block">
                        {trigger.statusDescription}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(trigger)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteTrigger(trigger.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTrigger ? "Edit Trigger" : "Create New Trigger"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Command</InputLabel>
              <Select
                value={formData.command.name}
                onChange={(e) => handleCommandChange(e.target.value)}
                label="Command"
              >
                {commandSpecs.map((spec) => (
                  <MenuItem key={spec.name} value={spec.name}>
                    {spec.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedCommandSpec &&
              selectedCommandSpec.params.map((param) => {
                const cleanParamName = stripTypeAnnotation(param);
                return (
                  <TextField
                    key={param}
                    fullWidth
                    label={cleanParamName}
                    value={formData.command.params[cleanParamName] || ""}
                    onChange={(e) => handleParamChange(param, e.target.value)}
                    helperText={`Parameter: ${param}`}
                  />
                );
              })}

            <TextField
              fullWidth
              label="Schedule"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              helperText="Cron format (e.g., '0 7 * * *') or natural language (e.g., 'now + 5 minutes')"
            />

            <TextField
              fullWidth
              label="Condition (Optional)"
              value={formData.condition || ""}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              helperText="Optional condition (e.g., 'temperature < 20')"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.enabled ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, enabled: e.target.checked })
                  }
                />
              }
              label="Enabled"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveTrigger}
            variant="contained"
            color="primary"
            disabled={!formData.name || !formData.command.name || !formData.schedule}
          >
            {editingTrigger ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TriggersTab;
