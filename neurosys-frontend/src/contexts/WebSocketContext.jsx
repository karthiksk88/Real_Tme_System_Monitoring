import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_BASE_URL } from '../utils/constants';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [stompClient, setStompClient] = useState(null);
  const [connectionState, setConnectionState] = useState('CONNECTING'); // 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'
  const [lastUpdateAt, setLastUpdateAt] = useState(new Date());
  const [liveDashboardData, setLiveDashboardData] = useState(null);
  const [latestAlert, setLatestAlert] = useState(null);
  const [notifications, setNotifications] = useState([
    {
      id: 'init-1',
      type: 'INFO',
      title: 'NeuroSys System Initialized',
      message: 'Monitoring active across computer endpoints.',
      timestamp: new Date(),
      read: false
    }
  ]);

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => [
      {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        type: notif.type || 'INFO',
        title: notif.title || 'System Notification',
        message: notif.message || '',
        timestamp: new Date(),
        read: false
      },
      ...prev.slice(0, 49) // Keep last 50 notifications
    ]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const updateLastSeen = useCallback(() => {
    setLastUpdateAt(new Date());
  }, []);

  useEffect(() => {
    let activeClient = null;

    try {
      activeClient = new Client({
        webSocketFactory: () => new SockJS(WS_BASE_URL),
        reconnectDelay: 4000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          setConnectionState('CONNECTED');
          setLastUpdateAt(new Date());
          console.log('Connected to NeuroSys STOMP WebSocket broker');

          // Subscribe to Dashboard Telemetry Topic
          activeClient.subscribe('/topic/dashboard', (message) => {
            if (message.body) {
              try {
                const data = JSON.parse(message.body);
                setLiveDashboardData(data);
                setLastUpdateAt(new Date());
              } catch (e) {
                console.error('Error parsing dashboard WebSocket message', e);
              }
            }
          });

          // Subscribe to Alerts Topic
          activeClient.subscribe('/topic/alerts', (message) => {
            if (message.body) {
              try {
                const alert = JSON.parse(message.body);
                setLatestAlert(alert);
                setLastUpdateAt(new Date());
                addNotification({
                  type: alert.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
                  title: alert.title || 'Hardware Alert',
                  message: alert.message || ''
                });
              } catch (e) {
                console.error('Error parsing alert WebSocket message', e);
              }
            }
          });
        },
        onDisconnect: () => {
          setConnectionState('DISCONNECTED');
          console.log('Disconnected from NeuroSys STOMP WebSocket broker');
        },
        onStompError: (frame) => {
          setConnectionState('DISCONNECTED');
          console.error('STOMP protocol error', frame);
        },
        onWebSocketClose: () => {
          setConnectionState('DISCONNECTED');
        }
      });

      activeClient.activate();
      setStompClient(activeClient);
    } catch (e) {
      setConnectionState('DISCONNECTED');
    }

    return () => {
      if (activeClient) {
        activeClient.deactivate();
      }
    };
  }, [addNotification]);

  return (
    <WebSocketContext.Provider
      value={{
        connectionState,
        isConnected: connectionState === 'CONNECTED',
        lastUpdateAt,
        updateLastSeen,
        liveDashboardData,
        latestAlert,
        notifications,
        addNotification,
        markAllAsRead,
        stompClient
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
