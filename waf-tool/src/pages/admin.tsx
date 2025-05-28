import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { format } from 'date-fns';

interface BlockedIP {
  ip: string;
  reason: string;
  blockedAt: string;
  expiresAt: string;
}

interface AttackLog {
  ip: string;
  attackType: string;
  timestamp: string;
  details: string;
}

const AdminPanel: React.FC = () => {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [attackLogs, setAttackLogs] = useState<AttackLog[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIP, setSelectedIP] = useState('');
  const [blockDuration, setBlockDuration] = useState('24');

  useEffect(() => {
    fetchBlockedIPs();
    fetchAttackLogs();
  }, []);

  const fetchBlockedIPs = async () => {
    try {
      const response = await fetch('/api/admin/blocked-ips');
      const data = await response.json() as BlockedIP[];
      setBlockedIPs(data);
    } catch (error) {
      console.error('Error fetching blocked IPs:', error);
    }
  };

  const fetchAttackLogs = async () => {
    try {
      const response = await fetch('/api/admin/attack-logs');
      const data = await response.json() as AttackLog[];
      setAttackLogs(data);
    } catch (error) {
      console.error('Error fetching attack logs:', error);
    }
  };

  const handleBlockIP = async () => {
    try {
      await fetch('/api/admin/block-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip: selectedIP,
          duration: parseInt(blockDuration),
        }),
      });
      setOpenDialog(false);
      fetchBlockedIPs();
    } catch (error) {
      console.error('Error blocking IP:', error);
    }
  };

  const handleUnblockIP = async (ip: string) => {
    try {
      await fetch(`/api/admin/unblock-ip/${ip}`, {
        method: 'POST',
      });
      fetchBlockedIPs();
    } catch (error) {
      console.error('Error unblocking IP:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        WAF Admin Panel
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenDialog(true)}
          sx={{ mb: 2 }}
        >
          Block New IP
        </Button>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>IP Address</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Blocked At</TableCell>
                <TableCell>Expires At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {blockedIPs.map((ip) => (
                <TableRow key={ip.ip}>
                  <TableCell>{ip.ip}</TableCell>
                  <TableCell>{ip.reason}</TableCell>
                  <TableCell>{format(new Date(ip.blockedAt), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                  <TableCell>{format(new Date(ip.expiresAt), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleUnblockIP(ip.ip)}
                    >
                      Unblock
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Typography variant="h5" gutterBottom>
        Attack Logs
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>IP Address</TableCell>
              <TableCell>Attack Type</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attackLogs.map((log, index) => (
              <TableRow key={index}>
                <TableCell>{log.ip}</TableCell>
                <TableCell>{log.attackType}</TableCell>
                <TableCell>{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                <TableCell>{log.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Block IP Address</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="IP Address"
            fullWidth
            value={selectedIP}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedIP(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Block Duration (hours)"
            type="number"
            fullWidth
            value={blockDuration}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBlockDuration(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleBlockIP} color="primary">
            Block
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPanel; 