import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.socket = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 seconds
  }

  // Connect to WebSocket server
  connect(onConnected, onError) {
    return new Promise((resolve, reject) => {
      try {
        // Create SockJS connection
        this.socket = new SockJS('http://localhost:8080/ws');
        
        // Create STOMP client
        this.stompClient = Stomp.over(this.socket);
        
        // Disable debug logging in production
        this.stompClient.debug = (msg) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[WebSocket]', msg);
          }
        };

        // Connect to server
        this.stompClient.connect(
          {},
          (frame) => {
            console.log('✅ WebSocket Connected:', frame);
            this.connected = true;
            this.reconnectAttempts = 0;
            
            if (onConnected) onConnected(frame);
            resolve(this.stompClient);
          },
          (error) => {
            console.error('❌ WebSocket Connection Error:', error);
            this.connected = false;
            
            if (onError) onError(error);
            
            // Attempt to reconnect
            this.attemptReconnect(onConnected, onError);
            
            reject(error);
          }
        );
      } catch (error) {
        console.error('❌ WebSocket Setup Error:', error);
        reject(error);
      }
    });
  }

  // Attempt to reconnect
  attemptReconnect(onConnected, onError) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect(onConnected, onError);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  // Subscribe to a deal's chat topic
  subscribeToDealChat(dealId, onMessageReceived) {
    if (!this.connected || !this.stompClient) {
      console.error('❌ WebSocket not connected');
      return null;
    }

    const topic = `/topic/chat/${dealId}`;
    
    // Check if already subscribed
    if (this.subscriptions.has(topic)) {
      console.log(`⚠️ Already subscribed to ${topic}`);
      return this.subscriptions.get(topic);
    }

    try {
      const subscription = this.stompClient.subscribe(topic, (message) => {
        try {
          const parsedMessage = JSON.parse(message.body);
          console.log('📨 Message received:', parsedMessage);
          if (onMessageReceived) {
            onMessageReceived(parsedMessage);
          }
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      });

      this.subscriptions.set(topic, subscription);
      console.log(`✅ Subscribed to ${topic}`);
      return subscription;
    } catch (error) {
      console.error('❌ Error subscribing to topic:', error);
      return null;
    }
  }

  // Subscribe to deal assignment notifications (for customer waiting for SE assignment)
  subscribeToDealAssignment(dealId, onAssigned) {
    if (!this.connected || !this.stompClient) {
      console.error('❌ WebSocket not connected');
      return null;
    }

    const topic = `/topic/deal/${dealId}/assignment`;
    
    if (this.subscriptions.has(topic)) {
      console.log(`⚠️ Already subscribed to ${topic}`);
      return this.subscriptions.get(topic);
    }

    try {
      const subscription = this.stompClient.subscribe(topic, (message) => {
        try {
          const deal = JSON.parse(message.body);
          console.log('🔔 Sales Executive assigned:', deal);
          if (onAssigned) {
            onAssigned(deal);
          }
        } catch (error) {
          console.error('❌ Error parsing assignment message:', error);
        }
      });

      this.subscriptions.set(topic, subscription);
      console.log(`✅ Subscribed to deal assignment: ${topic}`);
      return subscription;
    } catch (error) {
      console.error('❌ Error subscribing to assignment:', error);
      return null;
    }
  }

  // Subscribe to new customer notifications (for sales executive dashboard)
  subscribeToNewCustomers(salesExecutiveId, onNewCustomer) {
    if (!this.connected || !this.stompClient) {
      console.error('❌ WebSocket not connected');
      return null;
    }

    const topic = `/topic/sales-executive/${salesExecutiveId}/new-customer`;
    
    if (this.subscriptions.has(topic)) {
      console.log(`⚠️ Already subscribed to ${topic}`);
      return this.subscriptions.get(topic);
    }

    try {
      const subscription = this.stompClient.subscribe(topic, (message) => {
        try {
          const newDeal = JSON.parse(message.body);
          console.log('🔔 New customer assigned:', newDeal);
          if (onNewCustomer) {
            onNewCustomer(newDeal);
          }
        } catch (error) {
          console.error('❌ Error parsing new customer message:', error);
        }
      });

      this.subscriptions.set(topic, subscription);
      console.log(`✅ Subscribed to new customers: ${topic}`);
      return subscription;
    } catch (error) {
      console.error('❌ Error subscribing to new customers:', error);
      return null;
    }
  }

  // Subscribe to per-deal health updates (for customer + sales views)
  subscribeToDealHealth(dealId, onHealth) {
    if (!this.connected || !this.stompClient) {
      console.error('❌ WebSocket not connected');
      return null;
    }

    const topic = `/topic/deal/${dealId}/health`;

    if (this.subscriptions.has(topic)) {
      return this.subscriptions.get(topic);
    }

    try {
      const subscription = this.stompClient.subscribe(topic, (message) => {
        try {
          const deal = JSON.parse(message.body);
          if (onHealth) onHealth(deal);
        } catch (error) {
          console.error('❌ Error parsing health message:', error);
        }
      });

      this.subscriptions.set(topic, subscription);
      console.log(`✅ Subscribed to deal health: ${topic}`);
      return subscription;
    } catch (error) {
      console.error('❌ Error subscribing to deal health:', error);
      return null;
    }
  }

  // Subscribe to sales-executive stream of deal health updates
  subscribeToSalesExecutiveDealHealth(salesExecutiveId, onHealth) {
    if (!this.connected || !this.stompClient) {
      console.error('❌ WebSocket not connected');
      return null;
    }

    const topic = `/topic/sales-executive/${salesExecutiveId}/deal-health`;

    if (this.subscriptions.has(topic)) {
      return this.subscriptions.get(topic);
    }

    try {
      const subscription = this.stompClient.subscribe(topic, (message) => {
        try {
          const deal = JSON.parse(message.body);
          if (onHealth) onHealth(deal);
        } catch (error) {
          console.error('❌ Error parsing sales-exec health message:', error);
        }
      });

      this.subscriptions.set(topic, subscription);
      console.log(`✅ Subscribed to sales executive deal health: ${topic}`);
      return subscription;
    } catch (error) {
      console.error('❌ Error subscribing to sales executive deal health:', error);
      return null;
    }
  }

  // Unsubscribe from a deal's chat topic
  unsubscribeFromDealChat(dealId) {
    const topic = `/topic/chat/${dealId}`;
    const subscription = this.subscriptions.get(topic);
    
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(topic);
      console.log(`✅ Unsubscribed from ${topic}`);
    }
  }

  // Send a message to a deal's chat
  sendMessage(dealId, message) {
    if (!this.connected || !this.stompClient) {
      console.error('❌ WebSocket not connected');
      return false;
    }

    try {
      const destination = `/app/chat/${dealId}`;
      this.stompClient.send(destination, {}, JSON.stringify(message));
      console.log('📤 Message sent:', message);
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.stompClient && this.connected) {
      // Unsubscribe from all topics
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();

      // Disconnect STOMP client
      this.stompClient.disconnect(() => {
        console.log('✅ WebSocket Disconnected');
      });

      this.connected = false;
      this.stompClient = null;
      this.socket = null;
    }
  }

  // Check if connected
  isConnected() {
    return this.connected;
  }

  // Get active subscriptions count
  getSubscriptionsCount() {
    return this.subscriptions.size;
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
