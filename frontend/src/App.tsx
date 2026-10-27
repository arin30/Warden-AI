import React, { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { RequestCard } from './components/RequestCard';
import { Alert } from './components/Alert';
import {
  ShieldCheck,
  ShieldAlert,
  Radio,
  History,
  Lock,
  RefreshCw,
  Cpu,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Flame
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  agent_name: string;
  action_type: string;
  payload: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const App: React.FC = () => {
  const {
    pendingRequests,
    setPendingRequests,
    connectionStatus,
    breachAlert,
    clearBreachAlert,
    sendDecision
  } = useWebSocket();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'audit'>('pending');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAuditLogs(json.data);

        // Hydrate pendingRequests with any unhandled requests from SQLite
        const pendingFromDb = json.data.filter((item: AuditLogEntry) => item.status === 'pending');
        setPendingRequests((currentPending) => {
          const merged = [...currentPending];
          for (const item of pendingFromDb) {
            if (!merged.some((p) => p.id === item.id)) {
              merged.push({
                id: item.id,
                agent_name: item.agent_name,
                action_type: item.action_type,
                payload: item.payload,
                status: 'pending',
                timestamp: item.timestamp
              });
            }
          }
          return merged;
        });
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching initial audit logs:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [setPendingRequests]);

  // Initial fetch on mount to hydrate state
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Handle decisions with local audit log sync
  const handleDecision = (id: string, decision: 'approved' | 'rejected', reason?: string) => {
    sendDecision(id, decision, reason);

    // Update local audit logs display
    setAuditLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, status: decision } : log))
    );
  };

  const approvedCount = auditLogs.filter((log) => log.status === 'approved').length;
  const rejectedCount = auditLogs.filter((log) => log.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col relative">
      {/* Full-Screen Lockdown Modal on Honeypot Intrusion */}
      {breachAlert && <Alert breach={breachAlert} onDismiss={clearBreachAlert} />}

      {/* Top Navigation / Zero-Trust Bar */}
      <header className="sticky top-0 z-40 bg-[#0d1322]/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 p-0.5 shadow-lg shadow-rose-950/40">
              <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
                <Lock className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">Warden-AI</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800/60 font-mono flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-400" /> Active IDS Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Autonomous AI Intrusion Detection & Zero-Trust Control Plane</p>
            </div>
          </div>

          {/* Connection Status Pill & Actions */}
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono border ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                  : 'bg-rose-950/40 text-rose-300 border-rose-800/50'
              }`}
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  connectionStatus === 'connected'
                    ? 'text-emerald-400 animate-pulse'
                    : connectionStatus === 'connecting'
                    ? 'text-amber-400 animate-spin'
                    : 'text-rose-400'
                }`}
              />
              <span className="capitalize">{connectionStatus}</span>
            </div>

            <button
              onClick={fetchAuditLogs}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Refresh Audit Logs"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Metric Banners */}
      <div className="bg-[#0f1628] border-b border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center space-x-6 text-slate-400">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>Target: <strong className="text-slate-200">Autonomous Agent Intercept</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Policy: <strong className="text-slate-200">Zero-Trust Honeypot Trap</strong></span>
            </div>
            <div className="flex items-center space-x-2 text-rose-400">
              <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Honeypot: <strong className="text-rose-300">.env.decoy (ARMED)</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Pending: {pendingRequests.length}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">Approved: {approvedCount}</span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400">Rejected: {rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'pending'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Pending Action Gate</span>
              {pendingRequests.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'audit'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Immutable Audit Trail ({auditLogs.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Pending Intercepts */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            {pendingRequests.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">
                    Showing <strong className="text-amber-400">{pendingRequests.length}</strong> intercepted AI action{pendingRequests.length > 1 ? 's' : ''} paused awaiting human sign-off:
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    HTTP connections held via In-Memory Promise Hold
                  </span>
                </div>

                {pendingRequests.map((req) => (
                  <RequestCard key={req.id} request={req} onDecision={handleDecision} />
                ))}
              </div>
            ) : (
              /* Empty State: System Secure */
              <div className="my-12 p-12 rounded-2xl border border-slate-800 bg-[#0d1322] flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-slate-100">System Secure: No pending AI actions</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    The reverse proxy is actively monitoring MCP tool calls and holding any incoming terminal commands or filesystem modifications for verification.
                  </p>
                </div>
                <div className="pt-2 flex items-center space-x-3 text-xs font-mono text-slate-500">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Listening on /api/mcp/execute
                  </span>
                  <span>•</span>
                  <span>Zero-Trust Gate Armed</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">SQLite Audit Trail (Chronological order)</span>
              <span className="text-slate-500 font-mono">WAL Mode Active</span>
            </div>

            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-slate-800 rounded-xl bg-slate-900/30">
                No audit entries recorded yet.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-[#0d1322] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Agent</th>
                        <th className="px-4 py-3">Action Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Request ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 text-slate-300">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sky-400">{log.agent_name}</td>
                          <td className="px-4 py-3 text-slate-300 font-semibold">{log.action_type}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                log.status === 'approved'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : log.status === 'rejected'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                              }`}
                            >
                              {log.status === 'approved' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                              {log.status === 'rejected' && <XCircle className="w-3 h-3 text-rose-400" />}
                              {log.status === 'pending' && <AlertCircle className="w-3 h-3 text-amber-400" />}
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-[11px]" title={log.id}>
                            {log.id.slice(0, 8)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
