import { useState, useEffect, useRef, useCallback } from 'react';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface PendingRequest {
  id: string;
  agent_name: string;
  action_type: string;
  payload: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

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

interface WebSocketHookResult {
  pendingRequests: PendingRequest[];
  setPendingRequests: React.Dispatch<React.SetStateAction<PendingRequest[]>>;
  connectionStatus: ConnectionStatus;
  breachAlert: CriticalBreachData | null;
  clearBreachAlert: () => void;
  sendDecision: (id: string, decision: 'approved' | 'rejected', reason?: string) => void;
}

export function useWebSocket(url?: string): WebSocketHookResult {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [breachAlert, setBreachAlert] = useState<CriticalBreachData | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const getWsUrl = useCallback((): string => {
    if (url) return url;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    return `${protocol}//${host}:3001`;
  }, [url]);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (!isMounted) return;
      setConnectionStatus('connecting');

      const targetUrl = getWsUrl();
      const ws = new WebSocket(targetUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setConnectionStatus('connected');
        console.log('[WebSocket] Successfully connected to Security Gateway backend at', targetUrl);
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'NEW_PENDING_REQUEST') {
            setPendingRequests((prev) => {
              if (prev.some((req) => req.id === data.id)) return prev;
              const newReq: PendingRequest = {
                id: data.id,
                agent_name: data.agent_name || 'autonomous-agent',
                action_type: data.action_type || 'mcp_tool_call',
                payload: data.payload,
                status: 'pending',
                timestamp: data.timestamp || new Date().toISOString()
              };
              return [newReq, ...prev];
            });
          } else if (data.type === 'REQUEST_STATUS_UPDATED') {
            setPendingRequests((prev) =>
              prev.filter((req) => req.id !== data.id)
            );
          } else if (data.type === 'CRITICAL_BREACH') {
            console.error('[WebSocket] CRITICAL BREACH EVENT RECEIVED:', data);
            setBreachAlert({
              id: data.id,
              severity: data.severity || 'CRITICAL',
              agent_name: data.agent_name || 'unknown-agent',
              session_id: data.session_id || 'unknown-session',
              target_file: data.target_file || '.env.decoy',
              action_type: data.action_type || 'read_file',
              reason: data.reason || 'Cryptographic Decoy Honeypot Triggered',
              timestamp: data.timestamp || new Date().toISOString()
            });
          }
        } catch (err) {
          console.error('[WebSocket] Failed to process incoming message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Socket connection error:', error);
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setConnectionStatus('disconnected');
        console.warn('[WebSocket] Connection closed. Attempting reconnection in 3s...');
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 3000);
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [getWsUrl]);

  const sendDecision = useCallback((id: string, decision: 'approved' | 'rejected', reason?: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'APPROVAL_DECISION',
        id,
        decision,
        reason: reason || (decision === 'approved' ? 'Approved by human operator' : 'Rejected by human operator')
      };
      socketRef.current.send(JSON.stringify(message));

      // Optimistically remove from pending list
      setPendingRequests((prev) => prev.filter((req) => req.id !== id));
    } else {
      console.error('[WebSocket] Cannot dispatch approval decision: WebSocket is not connected.');
    }
  }, []);

  const clearBreachAlert = useCallback(() => {
    setBreachAlert(null);
  }, []);

  return {
    pendingRequests,
    setPendingRequests,
    connectionStatus,
    breachAlert,
    clearBreachAlert,
    sendDecision
  };
}
