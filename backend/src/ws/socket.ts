import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { pendingRequests } from '../proxy/interceptor';
import { updateAuditLogStatus, AuditLogStatus } from '../db/client';

let wss: WebSocketServer | null = null;

export interface ApprovalDecisionPayload {
  type: 'APPROVAL_DECISION';
  id: string;
  decision: 'approved' | 'rejected';
  reason?: string;
}

export function initWebSocketServer(server: HttpServer): WebSocketServer {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] Client dashboard connected to real-time control stream.');

    // Send connection handshake acknowledgment
    ws.send(JSON.stringify({
      type: 'CONNECTION_ESTABLISHED',
      timestamp: new Date().toISOString()
    }));

    ws.on('message', (rawMessage: Buffer | string) => {
      try {
        const parsed = JSON.parse(rawMessage.toString());

        if (parsed.type === 'APPROVAL_DECISION') {
          handleApprovalDecision(parsed as ApprovalDecisionPayload);
        } else if (parsed.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
        }
      } catch (err: unknown) {
        console.error('[WebSocket] Error parsing client message:', err);
      }
    });

    ws.on('error', (err: Error) => {
      console.error('[WebSocket] Socket error occurred:', err.message);
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client dashboard disconnected.');
    });
  });

  return wss;
}

export function broadcast(data: unknown): void {
  if (!wss) {
    console.warn('[WebSocket] Warning: Broadcast called before WebSocketServer initialized.');
    return;
  }

  const payload = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

export function broadcastCriticalBreach(breachData: unknown): void {
  if (!wss) return;
  const payload = JSON.stringify({
    type: 'CRITICAL_BREACH',
    timestamp: new Date().toISOString(),
    ...(typeof breachData === 'object' && breachData !== null ? breachData : { details: breachData })
  });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

export function terminateAllConnections(reason = 'CRITICAL_BREACH: Intrusion Honeypot Triggered'): void {
  if (!wss) return;
  console.error(`[WebSocket] Terminating all client connections: ${reason}`);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.close(1008, reason);
    }
  }
}

function handleApprovalDecision(msg: ApprovalDecisionPayload): void {
  const { id, decision, reason } = msg;
  const status: AuditLogStatus = decision === 'approved' ? 'approved' : 'rejected';

  console.log(`[WebSocket] Received APPROVAL_DECISION: id=${id}, decision=${decision}`);

  // 1. Update SQLite database status
  updateAuditLogStatus(id, status);

  // 2. Look up the id in pendingRequests Map and unblock/reject the held HTTP promise
  const requestHolder = pendingRequests.get(id);
  if (requestHolder) {
    if (decision === 'approved') {
      requestHolder.resolve({
        id,
        status: 'approved',
        timestamp: new Date().toISOString()
      });
    } else {
      requestHolder.reject(new Error(reason || 'Operator rejected this action in security dashboard.'));
    }

    // 3. Remove the id from the in-memory Map
    pendingRequests.delete(id);
  } else {
    console.warn(`[WebSocket] Warning: Pending request with id ${id} not found in memory (may have timed out or already handled).`);
  }

  // 4. Broadcast the updated status to all connected frontend clients
  broadcast({
    type: 'REQUEST_STATUS_UPDATED',
    id,
    status,
    timestamp: new Date().toISOString()
  });
}
