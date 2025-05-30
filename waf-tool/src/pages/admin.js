var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { format } from 'date-fns';
var AdminPanel = function () {
    var _a = useState([]), blockedIPs = _a[0], setBlockedIPs = _a[1];
    var _b = useState([]), attackLogs = _b[0], setAttackLogs = _b[1];
    var _c = useState(false), openDialog = _c[0], setOpenDialog = _c[1];
    var _d = useState(''), selectedIP = _d[0], setSelectedIP = _d[1];
    var _e = useState('24'), blockDuration = _e[0], setBlockDuration = _e[1];
    useEffect(function () {
        fetchBlockedIPs();
        fetchAttackLogs();
    }, []);
    var fetchBlockedIPs = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('/api/admin/blocked-ips')];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setBlockedIPs(data);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error fetching blocked IPs:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var fetchAttackLogs = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('/api/admin/attack-logs')];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setAttackLogs(data);
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Error fetching attack logs:', error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleBlockIP = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch('/api/admin/block-ip', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                ip: selectedIP,
                                duration: parseInt(blockDuration),
                            }),
                        })];
                case 1:
                    _a.sent();
                    setOpenDialog(false);
                    fetchBlockedIPs();
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error('Error blocking IP:', error_3);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleUnblockIP = function (ip) { return __awaiter(void 0, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("/api/admin/unblock-ip/".concat(ip), {
                            method: 'POST',
                        })];
                case 1:
                    _a.sent();
                    fetchBlockedIPs();
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _a.sent();
                    console.error('Error unblocking IP:', error_4);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(Container, __assign({ maxWidth: "lg", sx: { mt: 4, mb: 4 } }, { children: [_jsx(Typography, __assign({ variant: "h4", gutterBottom: true }, { children: "WAF Admin Panel" })), _jsxs(Box, __assign({ sx: { mb: 4 } }, { children: [_jsx(Button, __assign({ variant: "contained", color: "primary", onClick: function () { return setOpenDialog(true); }, sx: { mb: 2 } }, { children: "Block New IP" })), _jsx(TableContainer, __assign({ component: Paper }, { children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "IP Address" }), _jsx(TableCell, { children: "Reason" }), _jsx(TableCell, { children: "Blocked At" }), _jsx(TableCell, { children: "Expires At" }), _jsx(TableCell, { children: "Actions" })] }) }), _jsx(TableBody, { children: blockedIPs.map(function (ip) { return (_jsxs(TableRow, { children: [_jsx(TableCell, { children: ip.ip }), _jsx(TableCell, { children: ip.reason }), _jsx(TableCell, { children: format(new Date(ip.blockedAt), 'yyyy-MM-dd HH:mm:ss') }), _jsx(TableCell, { children: format(new Date(ip.expiresAt), 'yyyy-MM-dd HH:mm:ss') }), _jsx(TableCell, { children: _jsx(Button, __assign({ variant: "outlined", color: "error", onClick: function () { return handleUnblockIP(ip.ip); } }, { children: "Unblock" })) })] }, ip.ip)); }) })] }) }))] })), _jsx(Typography, __assign({ variant: "h5", gutterBottom: true }, { children: "Attack Logs" })), _jsx(TableContainer, __assign({ component: Paper }, { children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "IP Address" }), _jsx(TableCell, { children: "Attack Type" }), _jsx(TableCell, { children: "Timestamp" }), _jsx(TableCell, { children: "Details" })] }) }), _jsx(TableBody, { children: attackLogs.map(function (log, index) { return (_jsxs(TableRow, { children: [_jsx(TableCell, { children: log.ip }), _jsx(TableCell, { children: log.attackType }), _jsx(TableCell, { children: format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss') }), _jsx(TableCell, { children: log.details })] }, index)); }) })] }) })), _jsxs(Dialog, __assign({ open: openDialog, onClose: function () { return setOpenDialog(false); } }, { children: [_jsx(DialogTitle, { children: "Block IP Address" }), _jsxs(DialogContent, { children: [_jsx(TextField, { autoFocus: true, margin: "dense", label: "IP Address", fullWidth: true, value: selectedIP, onChange: function (e) { return setSelectedIP(e.target.value); } }), _jsx(TextField, { margin: "dense", label: "Block Duration (hours)", type: "number", fullWidth: true, value: blockDuration, onChange: function (e) { return setBlockDuration(e.target.value); } })] }), _jsxs(DialogActions, { children: [_jsx(Button, __assign({ onClick: function () { return setOpenDialog(false); } }, { children: "Cancel" })), _jsx(Button, __assign({ onClick: handleBlockIP, color: "primary" }, { children: "Block" }))] })] }))] })));
};
export default AdminPanel;
