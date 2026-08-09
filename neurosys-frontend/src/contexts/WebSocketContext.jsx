import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_BASE_URL } from '../utils/constants';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveDashboardData, setLiveDashboardData] = useState(null);
  const [latestAlert, setLatestAlert] = useState(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_BASE_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        console.log('Connected to NeuroSys STOMP WebSocket broker');

        // Subscribe to Dashboard Topic
        client.subscribe('/topic/dashboard', (message) => {
          if (message.body) {
            try {
              const data = JSON.parse(message.body);
              setLiveDashboardData(data);
            } catch (e) {
              console.error('Error parsing dashboard WebSocket message', e);
            }
          }
        });

        // Subscribe to Alerts Topic
        client.subscribe('/topic/alerts', (message) => {
          if (message.body) {
            try {
              const alert = JSON.parse(message.body);
              setLatestAlert(alert);
            } catch (e) {
              console.error('Error parsing alert WebSocket message', e);
            }
          }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log('Disconnected from NeuroSys STOMP WebSocket broker');
      },
      onStompError: (frame) => {
        console.error('STOMP protocol error', frame);
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, liveDashboardData, latestAlert, stompClient }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
