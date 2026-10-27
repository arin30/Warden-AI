import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Lock,
  Flame,
  CheckCircle2,
  FileCode2,
  Bot,
  Clock,
  Radio
} from 'lucide-react';

export interface CriticalBreachData {
  id?: string;
  severity?: string;
  agent_name: string;
  session_id: string;
  target_file: string;
  action_type: string;
  reason?: string;
  timestamp: string;
}

interface AlertModalProps {
  breach: CriticalBreachData;
  onDismiss: () => void;
}

export const Alert: React.FC<AlertModalProps> = ({ breach, onDismiss }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative max-w-2xl w-full bg-[#160b0e] border-2 border-rose-600/80 rounded-2xl shadow-[0_0_80px_rgba(225,29,72,0.4)] overflow-hidden">
        {/* Top Hazard Warning Banner */}
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 px-6 py-4 border-b border-rose-600/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-950/80 animate-bounce">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-extrabold tracking-widest text-rose-300 font-mono">
                  [IDS ACTIVE DEFENSE PROTOCOL]
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white animate-pulse">
                  CRITICAL BREACH
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5 mt-0.5">
                <Flame className="w-4 h-4 text-amber-400" />
                Honeypot Decoy Asset Triggered
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-700/60 text-rose-300 text-xs font-mono">
            <Radio className="w-3.5 h-3.5 animate-ping text-rose-400" />
            <span>LOCKDOWN</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-rose-200/90 leading-relaxed">
              <p className="font-semibold text-rose-100">
                Unauthorized attempt to read canary asset detected!
              </p>
              <p>
                An autonomous agent attempted to access <code className="text-amber-300 bg-rose-950/80 px-1.5 py-0.5 rounded font-mono font-bold">{breach.target_file}</code>.
                The Warden-AI Intrusion Detection System has immediately severed client connections and quarantined all execution rights.
              </p>
            </div>
          </div>

          {/* Incident Forensic Matrix */}
          <div className="rounded-xl border border-rose-900/40 bg-black/50 overflow-hidden divide-y divide-rose-950/80 font-mono text-xs">
            <div className="grid grid-cols-3 p-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-sky-400" /> Rogue Agent
              </span>
              <span className="col-span-2 text-rose-300 font-bold">{breach.agent_name}</span>
            </div>

            <div className="grid grid-cols-3 p-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> Session ID
              </span>
              <span className="col-span-2 text-slate-300 break-all">{breach.session_id}</span>
            </div>

            <div className="grid grid-cols-3 p-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <FileCode2 className="w-3.5 h-3.5 text-rose-400" /> Target Asset
              </span>
              <span className="col-span-2 text-amber-400 font-bold">{breach.target_file}</span>
            </div>

            <div className="grid grid-cols-3 p-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Action Attempted
              </span>
              <span className="col-span-2 text-slate-300 font-semibold uppercase">{breach.action_type}</span>
            </div>

            <div className="grid grid-cols-3 p-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Breach Timestamp
              </span>
              <span className="col-span-2 text-slate-300">
                {new Date(breach.timestamp).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Defense Mitigation Steps Taken */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
            <span className="text-slate-400 font-mono uppercase tracking-wider text-[11px] font-bold block">
              Automated Countermeasures Executed:
            </span>
            <ul className="space-y-1.5 text-slate-300 font-mono">
              <li className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>MCP tool call blocked before filesystem disclosure.</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Agent execution token revoked & session blacklisted in SQLite.</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Client WebSocket connection severed with Policy Code 1008.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 px-6 py-4 border-t border-rose-950 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-500">
            Intrusion Log ID: <span className="text-rose-400 font-semibold">{breach.id ? breach.id.slice(0, 8) : 'QUARANTINE'}</span>
          </span>

          <button
            onClick={onDismiss}
            className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/80 transition-all flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Acknowledge Lockdown & Clear Alarm
          </button>
        </div>
      </div>
    </div>
  );
};
export default Alert;
