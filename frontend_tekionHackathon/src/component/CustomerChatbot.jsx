import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Car, DollarSign, Calendar, MessageSquare, 
  ChevronRight, X, Sparkles, Zap, ShieldCheck, ThumbsUp,
  History, Plus, ArrowLeft, Clock
} from 'lucide-react';
import { dealAPI, chatAPI, authAPI } from '../services/api';
import webSocketService from '../services/websocket';

const SYSTEM_DELAY = 800; // ms to fake typing

// Helper for unique IDs to prevent React key collisions
const generateId = () => Date.now() + Math.random();

// Mock Icons for options
const PhoneIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const MessageIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const MailIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const WhatsappIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16.5 16.5c-4 1-9-4-8-8"/></svg>;

const QUESTIONS = [
  {
    id: 'intro',
    text: "Welcome to Tekion Auto! I'm your AI Concierge. I can help you find your dream car in seconds. Ready to get started?",
    type: 'options',
    options: [
      { label: "Yes, let's go!", value: 'start', next: 'vehicle_class' },
      { label: "Just browsing", value: 'browsing', next: 'browsing_response' }
    ]
  },
  {
    id: 'vehicle_class',
    text: "Exciting! First, what type of vehicle fits your lifestyle?",
    type: 'grid-options',
    options: [
      { label: 'Sedan', icon: Car, value: 'sedan', next: 'budget' },
      { label: 'SUV', icon: ShieldCheck, value: 'suv', next: 'budget' },
      { label: 'Sports', icon: Zap, value: 'sports', next: 'budget' },
      { label: 'EV', icon: Sparkles, value: 'ev', next: 'budget' },
      { label: 'Used', icon: ThumbsUp, value: 'used', next: 'budget' }
    ]
  },
  {
    id: 'budget',
    text: "Great choice. What is your estimated budget for this vehicle?",
    type: 'input-currency',
    next: 'timeframe'
  },
  {
    id: 'timeframe',
    text: "Noted. When are you hoping to park this in your driveway?",
    type: 'options',
    options: [
      { label: "Immediately", value: 'immediate', next: 'communication' },
      { label: "Less than 1 month", value: '<1mo', next: 'communication' },
      { label: "1-3 months", value: '1-3mo', next: 'communication' },
      { label: "Just exploring", value: 'exploring', next: 'communication' }
    ]
  },
  {
    id: 'communication',
    text: "Last step! How would you prefer us to reach out with matches?",
    type: 'grid-options',
    options: [
      { label: 'Call', icon: PhoneIcon, value: 'call', next: 'closing' },
      { label: 'Text', icon: MessageIcon, value: 'text', next: 'closing' },
      { label: 'Email', icon: MailIcon, value: 'email', next: 'closing' },
      { label: 'WhatsApp', icon: WhatsappIcon, value: 'whatsapp', next: 'closing' }
    ]
  },
  {
    id: 'closing',
    text: "Perfect! I've curated a list of vehicles matching your criteria. A specialist is reviewing them now.",
    type: 'final'
  },
  {
    id: 'browsing_response',
    text: "No problem! Feel free to explore our inventory using the menu. I'm here if you need me.",
    type: 'final'
  }
];

const TypingIndicator = () => (
  <div className="flex gap-1 p-2 bg-[#2a2f38] rounded-2xl rounded-tl-none w-fit border border-[#3a414d]">
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    NEW: { color: 'bg-blue-500', text: 'New' },
    IN_PROGRESS: { color: 'bg-yellow-500', text: 'In Progress' },
    NEGOTIATION: { color: 'bg-purple-500', text: 'Negotiation' },
    CLOSED_WON: { color: 'bg-green-500', text: 'Won' },
    CLOSED_LOST: { color: 'bg-red-500', text: 'Lost' },
  };
  const config = statusConfig[status] || { color: 'bg-gray-500', text: status };
  return (
    <span className={`${config.color} text-white text-xs px-2 py-0.5 rounded-full`}>
      {config.text}
    </span>
  );
};

export default function CustomerChatbot() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeView, setActiveView] = useState('menu'); // 'menu', 'newDeal', 'myDeals', 'dealChat'
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStepId, setCurrentStepId] = useState('intro');
  const [inputValue, setInputValue] = useState('');
  const [chatInputValue, setChatInputValue] = useState('');
  const [dealId, setDealId] = useState(null);
  const [dealData, setDealData] = useState({});
  const [salesPersonJoined, setSalesPersonJoined] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const assignmentNotifiedRef = useRef(false); // Track if assignment notification was already shown
  
  // Past deals state
  const [pastDeals, setPastDeals] = useState([]);
  const [selectedPastDeal, setSelectedPastDeal] = useState(null);
  const [pastDealMessages, setPastDealMessages] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const pastDealMessagesRef = useRef([]); // Ref for past deal messages to avoid stale closure
  const currentUser = authAPI.getCurrentUser();

  // Keep ref in sync with state for past deal messages
  useEffect(() => {
    pastDealMessagesRef.current = pastDealMessages;
  }, [pastDealMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, pastDealMessages]);

  // Fetch past deals when viewing "My Deals"
  useEffect(() => {
    if (activeView === 'myDeals' && currentUser?.id) {
      fetchPastDeals();
    }
  }, [activeView]);

  const fetchPastDeals = async () => {
    try {
      setLoadingDeals(true);
      const deals = await dealAPI.getCustomerDeals(currentUser.id);
      console.log('Fetched customer deals:', deals);
      setPastDeals(deals || []);
    } catch (error) {
      console.error('Error fetching past deals:', error);
      setPastDeals([]);
    } finally {
      setLoadingDeals(false);
    }
  };

  const openDealChat = async (deal) => {
    setSelectedPastDeal(deal);
    setActiveView('dealChat');
    setDealId(deal.id);
    
    // Clear polling interval from previous deal if any
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    // Load chat history for this deal
    try {
      const chats = await chatAPI.getDealChats(deal.id);
      console.log('Fetched chat history:', chats);
      
      // Convert chat messages to display format
      const allMessages = [];
      if (Array.isArray(chats)) {
        chats.forEach(chat => {
          if (chat.messages && Array.isArray(chat.messages)) {
            chat.messages.forEach(msg => {
              const senderType = (msg.senderType || '').toLowerCase();
              allMessages.push({
                id: generateId(),
                from: senderType === 'customer' ? 'user' : senderType === 'bot' ? 'bot' : 'salesperson',
                text: msg.content,
                senderName: msg.senderName,
                timestamp: new Date(msg.timestamp)
              });
            });
          }
        });
      }
      
      // Sort by timestamp
      allMessages.sort((a, b) => a.timestamp - b.timestamp);
      setPastDealMessages(allMessages);
      
      // If deal has an assigned sales executive, enable chat mode and connect WebSocket
      if (deal.salesExecutiveId) {
        setSalesPersonJoined(true);
        setIsChatMode(true);
        
        // Always reconnect WebSocket to ensure fresh subscription for this deal
        connectWebSocketForDeal(deal.id);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setPastDealMessages([]);
    }
  };

  const connectWebSocketForDeal = async (dealIdToConnect) => {
    try {
      // Disconnect existing connection to get fresh subscriptions
      if (webSocketService.isConnected()) {
        webSocketService.disconnect();
      }
      
      await webSocketService.connect(
        (frame) => {
          console.log('WebSocket connected for deal:', dealIdToConnect);
          
          // Subscribe to chat messages
          webSocketService.stompClient.subscribe(`/topic/chat/${dealIdToConnect}`, (message) => {
            try {
              const parsedMessage = JSON.parse(message.body);
              console.log('Customer received WebSocket message:', parsedMessage);
              
              const senderType = (parsedMessage.senderType || '').toLowerCase();
              
              // Ignore own messages
              if (senderType === 'customer') {
                console.log('Ignoring own message');
                return;
              }
              
              // Add salesperson message to chat
              setPastDealMessages(prev => [...prev, {
                id: parsedMessage.id || generateId(),
                from: 'salesperson',
                text: parsedMessage.message || parsedMessage.content,
                senderName: parsedMessage.senderName,
                timestamp: new Date(parsedMessage.timestamp || Date.now())
              }]);
            } catch (error) {
              console.error('Error parsing message:', error);
            }
          });
          
          console.log('Subscribed to /topic/chat/' + dealIdToConnect);
        },
        (error) => {
          console.error('WebSocket connection error:', error);
        }
      );
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  // Keep old function for backward compatibility but redirect to new one
  const initializeWebSocketForDeal = connectWebSocketForDeal;

  const handleIncomingMessageForPastDeal = (message) => {
    console.log('Past deal received message:', message);
    
    const senderType = (message.senderType || '').toLowerCase();
    
    if (senderType === 'customer') {
      return;
    }
    
    setPastDealMessages(prev => [...prev, {
      id: message.id || generateId(),
      from: 'salesperson',
      text: message.message || message.content,
      senderName: message.senderName,
      timestamp: new Date(message.timestamp || Date.now())
    }]);
  };

  const sendPastDealMessage = (e) => {
    e.preventDefault();
    if (!chatInputValue.trim() || !selectedPastDeal?.id) return;

    const message = {
      dealId: selectedPastDeal.id,
      senderId: currentUser?.id,
      senderName: currentUser?.name || 'Customer',
      senderType: 'customer',
      content: chatInputValue.trim()
    };

    const sent = webSocketService.sendMessage(selectedPastDeal.id, message);
    
    if (sent) {
      setPastDealMessages(prev => [...prev, {
        id: generateId(),
        from: 'user',
        text: chatInputValue.trim(),
        timestamp: new Date()
      }]);
      setChatInputValue('');
    }
  };

  // Initialize WebSocket when deal is created (for new deals)
  useEffect(() => {
    if (dealId && activeView === 'newDeal') {
      // Always disconnect previous connection to get fresh subscriptions
      if (webSocketService.isConnected()) {
        webSocketService.disconnect();
      }
      initializeWebSocket();
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [dealId, activeView]);

  const showAssignmentNotification = (salesName, dealerName) => {
    // Prevent duplicate notifications
    if (assignmentNotifiedRef.current) {
      console.log('Assignment notification already shown, skipping');
      return;
    }
    assignmentNotifiedRef.current = true;
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    const dealerInfo = dealerName ? ` from ${dealerName}` : '';
    
    setMessages(prev => [...prev, {
      id: generateId(),
      from: 'system',
      text: `🎉 Great news! ${salesName}${dealerInfo} has been assigned to help you. You can start chatting now!`,
      timestamp: new Date()
    }]);
    
    setIsChatMode(true);
    setSalesPersonJoined(true);
  };

  const initializeWebSocket = async () => {
    // Reset notification flag for new deal
    assignmentNotifiedRef.current = false;
    
    try {
      await webSocketService.connect(
        async (frame) => {
          console.log('WebSocket connected for deal:', dealId);
          
          // First, check if deal is already assigned BEFORE subscribing
          // This handles the case where assignment happened while we were connecting
          try {
            const currentDeal = await dealAPI.getDeal(dealId);
            if (currentDeal.salesExecutiveId && currentDeal.salesExecutiveName) {
              console.log('Deal already assigned on connect:', currentDeal.salesExecutiveName);
              showAssignmentNotification(
                currentDeal.salesExecutiveName,
                currentDeal.dealerName || ''
              );
            }
          } catch (err) {
            console.log('Could not check initial deal status:', err);
          }
          
          // Subscribe to assignment notifications for future updates
          webSocketService.stompClient.subscribe(`/topic/deal/${dealId}/assignment`, (message) => {
            try {
              const assignedDeal = JSON.parse(message.body);
              console.log('Sales executive assigned via WebSocket:', assignedDeal);
              
              showAssignmentNotification(
                assignedDeal.salesExecutiveName || 'A sales specialist',
                assignedDeal.dealerName || ''
              );
            } catch (error) {
              console.error('Error parsing assignment notification:', error);
            }
          });
          
          webSocketService.subscribeToDealChat(dealId, handleIncomingMessage);
          
          // Poll for deal assignment as backup
          let pollCount = 0;
          const maxPolls = 15;
          
          pollIntervalRef.current = setInterval(async () => {
            pollCount++;
            
            // Skip if already notified
            if (assignmentNotifiedRef.current) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              return;
            }
            
            try {
              const currentDeal = await dealAPI.getDeal(dealId);
              
              if (currentDeal.salesExecutiveId && currentDeal.salesExecutiveName) {
                showAssignmentNotification(
                  currentDeal.salesExecutiveName,
                  currentDeal.dealerName || ''
                );
                return;
              }
            } catch (err) {
              console.log('Could not fetch deal status:', err);
            }
            
            if (pollCount >= maxPolls) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
            }
          }, 2000);
        },
        (error) => {
          console.error('WebSocket connection error:', error);
        }
      );
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  };

  const handleIncomingMessage = (message) => {
    const senderType = (message.senderType || '').toLowerCase();
    
    if (senderType === 'customer') {
      return;
    }
    
    if (senderType === 'sales_executive' && !salesPersonJoined) {
      setSalesPersonJoined(true);
      setIsChatMode(true);
      
      setMessages(prev => [...prev, {
        id: generateId(),
        from: 'system',
        text: `🎉 ${message.senderName} has joined the chat!`,
        timestamp: new Date()
      }]);
    }
    
    setMessages(prev => [...prev, {
      id: message.id || generateId(),
      from: 'salesperson',
      text: message.message || message.content,
      senderName: message.senderName,
      timestamp: new Date(message.timestamp || Date.now())
    }]);
  };

  const startNewDeal = () => {
    // Clean up previous WebSocket connection and polling
    if (webSocketService.isConnected()) {
      webSocketService.disconnect();
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    setActiveView('newDeal');
    setMessages([]);
    setDealId(null);
    setDealData({});
    setSalesPersonJoined(false);
    setIsChatMode(false);
    setCurrentStepId('intro');
    assignmentNotifiedRef.current = false; // Reset for new deal
    setPastDealMessages([]); // Clear past deal messages
    setSelectedPastDeal(null); // Clear selected past deal
    
    setTimeout(() => {
      addSystemMessage('intro');
    }, 300);
  };

  const addSystemMessage = (stepId) => {
    setIsTyping(true);
    const step = QUESTIONS.find(q => q.id === stepId);
    
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: generateId(),
        from: 'bot',
        text: step.text,
        widgetType: step.type,
        options: step.options,
        stepId: step.id
      }]);
    }, SYSTEM_DELAY);
  };

  const handleOptionClick = (option, currentStep) => {
    setMessages(prev => [...prev, {
      id: generateId(),
      from: 'user',
      text: option.label
    }]);

    if (currentStep === 'vehicle_class') {
      setDealData(prev => ({ ...prev, interestCategory: option.value.toUpperCase() }));
    } else if (currentStep === 'timeframe') {
      setDealData(prev => ({ ...prev, intendedTimeframe: option.value }));
    } else if (currentStep === 'communication') {
      setDealData(prev => ({ ...prev, preferredContactMode: option.value }));
    }

    if (option.next) {
      setCurrentStepId(option.next);
      
      if (option.next === 'closing') {
        createDeal();
      } else {
        addSystemMessage(option.next);
      }
    }
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const budgetValue = `${parseInt(inputValue).toLocaleString()}`;
    
    setMessages(prev => [...prev, {
      id: generateId(),
      from: 'user',
      text: `$${budgetValue}`
    }]);

    setDealData(prev => ({ ...prev, budgetRange: budgetValue }));
    setInputValue('');
    
    const currentQ = QUESTIONS.find(q => q.id === currentStepId);
    if (currentQ && currentQ.next) {
      setCurrentStepId(currentQ.next);
      addSystemMessage(currentQ.next);
    }
  };

  const createDeal = async () => {
    try {
      setIsTyping(true);
      addSystemMessage('closing');
      
      const dealPayload = {
        customerId: currentUser?.id,
        interestCategory: dealData.interestCategory || 'SUV',
        budgetRange: dealData.budgetRange || '50000',
        intendedTimeframe: dealData.intendedTimeframe || '1-3mo',
        preferredContactMode: dealData.preferredContactMode || 'phone'
      };

      const createdDeal = await dealAPI.initiateDeal(dealPayload);
      setDealId(createdDeal.id);
      
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: generateId(),
          from: 'bot',
          text: "✨ Perfect! I'm now connecting you with a specialist. They'll join this chat shortly!",
        }]);
      }, 1500);
      
    } catch (error) {
      console.error('Error creating deal:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: generateId(),
        from: 'bot',
        text: "I apologize, but I encountered an error. Please try again.",
      }]);
    }
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInputValue.trim() || !dealId) return;

    const message = {
      dealId: dealId,
      senderId: currentUser?.id,
      senderName: currentUser?.name || 'Customer',
      senderType: 'customer',
      content: chatInputValue.trim()
    };

    const sent = webSocketService.sendMessage(dealId, message);
    
    if (sent) {
      setMessages(prev => [...prev, {
        id: generateId(),
        from: 'user',
        text: chatInputValue.trim(),
        timestamp: new Date()
      }]);
      setChatInputValue('');
    }
  };

  const goBack = () => {
    if (activeView === 'dealChat') {
      setSelectedPastDeal(null);
      setPastDealMessages([]);
      if (dealId) {
        webSocketService.unsubscribeFromDealChat(dealId);
      }
      setDealId(null);
      setSalesPersonJoined(false);
      setIsChatMode(false);
    }
    setActiveView('menu');
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="chatbot-trigger fixed bottom-6 right-6 p-4 bg-[#00D9FF] hover:bg-[#00c4e6] text-black rounded-full shadow-[0_0_20px_rgba(0,217,255,0.4)] transition-all hover:scale-110 z-50 group"
      >
        <MessageSquare size={28} className="fill-black/10 stroke-black" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0f1115] animate-pulse" />
      </button>
    );
  }

  // Render messages helper
  const renderMessages = (messageList) => (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
      {messageList.map((msg) => (
        <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
          {(msg.from === 'bot' || msg.from === 'salesperson' || msg.from === 'system') && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 mt-auto border shrink-0 ${
              msg.from === 'salesperson' 
                ? 'bg-purple-600 border-purple-500' 
                : msg.from === 'system'
                ? 'bg-green-600 border-green-500'
                : 'bg-[#1f232b] border-[#2a2f38]'
            }`}>
              {msg.from === 'salesperson' ? (
                <User size={14} className="text-white" />
              ) : (
                <Bot size={14} className="text-[#00D9FF]" />
              )}
            </div>
          )}
          
          <div className={`max-w-[80%] space-y-2`}>
            {msg.from === 'salesperson' && msg.senderName && (
              <div className="text-xs text-gray-400 mb-1 ml-1">{msg.senderName}</div>
            )}
            <div className={`p-3.5 text-sm rounded-2xl ${
                msg.from === 'user' 
                    ? 'bg-[#00D9FF] text-black font-medium rounded-tr-sm' 
                    : msg.from === 'salesperson'
                    ? 'bg-purple-600 text-white rounded-tl-sm'
                    : msg.from === 'system'
                    ? 'bg-green-600/20 text-green-400 border border-green-600/50 rounded-lg text-center'
                    : 'bg-[#2a2f38] text-gray-200 border border-[#3a414d] rounded-tl-sm'
            }`}>
              {msg.text}
            </div>

            {msg.widgetType === 'options' && (
              <div className="flex flex-wrap gap-2 mt-2">
                {msg.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(opt, msg.stepId)}
                    className="px-4 py-2 bg-[#181b21] hover:bg-[#00D9FF]/10 hover:text-[#00D9FF] border border-[#2a2f38] hover:border-[#00D9FF]/50 rounded-full text-xs font-semibold text-gray-300 transition-all duration-200"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {msg.widgetType === 'grid-options' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {msg.options.map((opt, idx) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick(opt, msg.stepId)}
                      className="flex flex-col items-center gap-2 p-3 bg-[#181b21] hover:bg-[#00D9FF]/10 border border-[#2a2f38] hover:border-[#00D9FF]/50 rounded-xl text-gray-300 hover:text-[#00D9FF] transition-all group"
                    >
                      {Icon && <Icon className="w-6 h-6 text-gray-500 group-hover:text-[#00D9FF] transition-colors" />}
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {msg.widgetType === 'input-currency' && (
              <form onSubmit={handleInputSubmit} className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full bg-[#181b21] border border-[#2a2f38] rounded-xl pl-9 pr-4 py-3 text-white focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF] transition-all text-sm"
                    autoFocus
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!inputValue}
                  className="p-3 bg-[#00D9FF] text-black rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  <Send size={18} />
                </button>
              </form>
            )}
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-start animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-[#1f232b] flex items-center justify-center mr-2 border border-[#2a2f38]">
            <Bot size={14} className="text-[#00D9FF]" />
          </div>
          <TypingIndicator />
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0f1115] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#2a2f38] flex flex-col h-[80vh] overflow-hidden relative animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-[#2a2f38] flex items-center justify-between bg-[#181b21]">
          <div className="flex items-center gap-3">
            {activeView !== 'menu' && (
              <button onClick={goBack} className="p-1 hover:bg-[#2a2f38] rounded-full transition-colors mr-1">
                <ArrowLeft size={18} className="text-gray-400" />
              </button>
            )}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D9FF] to-blue-600 flex items-center justify-center">
                <Bot className="text-white w-6 h-6" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#181b21]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">
                {activeView === 'dealChat' && selectedPastDeal 
                  ? `Chat with ${selectedPastDeal.salesExecutiveName || 'Sales Team'}`
                  : 'Tekion AI Concierge'}
              </h3>
              <p className="text-[#00D9FF] text-xs font-medium">
                {activeView === 'menu' ? 'Welcome back!' : 'Online • Instantly replies'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-[#2a2f38] text-gray-400 hover:text-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Menu View */}
        {activeView === 'menu' && (
          <div className="flex-1 flex flex-col p-6 gap-4">
            <div className="text-center mb-4">
              <h2 className="text-white text-xl font-bold mb-2">Hello, {currentUser?.name || 'there'}! 👋</h2>
              <p className="text-gray-400 text-sm">What would you like to do today?</p>
            </div>
            
            <button
              onClick={startNewDeal}
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#00D9FF]/20 to-blue-600/20 border border-[#00D9FF]/50 rounded-2xl hover:border-[#00D9FF] transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#00D9FF]/20 flex items-center justify-center group-hover:bg-[#00D9FF]/30 transition-colors">
                <Plus size={24} className="text-[#00D9FF]" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold">Start New Inquiry</h3>
                <p className="text-gray-400 text-sm">Find your dream car</p>
              </div>
              <ChevronRight size={20} className="text-gray-500 ml-auto" />
            </button>
            
            <button
              onClick={() => setActiveView('myDeals')}
              className="flex items-center gap-4 p-4 bg-[#1f232b] border border-[#2a2f38] rounded-2xl hover:border-[#3a414d] transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                <History size={24} className="text-purple-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold">My Deals</h3>
                <p className="text-gray-400 text-sm">View past conversations</p>
              </div>
              <ChevronRight size={20} className="text-gray-500 ml-auto" />
            </button>
          </div>
        )}

        {/* My Deals View */}
        {activeView === 'myDeals' && (
          <div className="flex-1 overflow-y-auto p-4">
            {loadingDeals ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">Loading deals...</div>
              </div>
            ) : pastDeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <History size={48} className="text-gray-600 mb-4" />
                <h3 className="text-white font-semibold mb-2">No deals yet</h3>
                <p className="text-gray-400 text-sm mb-4">Start your first inquiry to see it here</p>
                <button
                  onClick={startNewDeal}
                  className="px-4 py-2 bg-[#00D9FF] text-black rounded-full font-semibold hover:opacity-90"
                >
                  Start New Inquiry
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {pastDeals.map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => openDealChat(deal)}
                    className="w-full p-4 bg-[#1f232b] border border-[#2a2f38] rounded-xl hover:border-[#3a414d] transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Car size={18} className="text-[#00D9FF]" />
                        <span className="text-white font-semibold">{deal.interestCategory || 'Vehicle Inquiry'}</span>
                      </div>
                      <StatusBadge status={deal.status} />
                    </div>
                    <div className="text-gray-400 text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <DollarSign size={14} />
                        <span>Budget: ${deal.budgetRange || 'Not specified'}</span>
                      </div>
                      {deal.salesExecutiveName && (
                        <div className="flex items-center gap-2">
                          <User size={14} />
                          <span>{deal.salesExecutiveName} • {deal.dealerName || 'Tekion Auto'}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>{new Date(deal.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New Deal Chat View */}
        {activeView === 'newDeal' && (
          <>
            {renderMessages(messages)}
            
            <div className="p-4 bg-[#181b21] border-t border-[#2a2f38]">
              {isChatMode ? (
                <form onSubmit={sendChatMessage} className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatInputValue}
                    onChange={(e) => setChatInputValue(e.target.value)}
                    placeholder="Type your message..." 
                    className="flex-1 bg-[#0f1115] border border-[#2a2f38] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF]"
                  />
                  <button 
                    type="submit"
                    disabled={!chatInputValue.trim()}
                    className="p-3 bg-[#00D9FF] text-black rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    <Send size={18} />
                  </button>
                </form>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Complete the chatbot to start chatting..." 
                    disabled={true} 
                    className="flex-1 bg-[#0f1115] border border-[#2a2f38] rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                  />
                  <button disabled className="p-3 bg-[#2a2f38] text-gray-500 rounded-xl cursor-not-allowed">
                    <Send size={18} />
                  </button>
                </div>
              )}
              <div className="text-center mt-2">
                <p className="text-[10px] text-gray-600">
                  {salesPersonJoined ? 'Connected with sales specialist' : 'Powered by Tekion Intelligence AI'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Past Deal Chat View */}
        {activeView === 'dealChat' && selectedPastDeal && (
          <>
            {renderMessages(pastDealMessages)}
            
            <div className="p-4 bg-[#181b21] border-t border-[#2a2f38]">
              {selectedPastDeal.salesExecutiveId ? (
                <form onSubmit={sendPastDealMessage} className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatInputValue}
                    onChange={(e) => setChatInputValue(e.target.value)}
                    placeholder="Type your message..." 
                    className="flex-1 bg-[#0f1115] border border-[#2a2f38] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF]"
                  />
                  <button 
                    type="submit"
                    disabled={!chatInputValue.trim()}
                    className="p-3 bg-[#00D9FF] text-black rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    <Send size={18} />
                  </button>
                </form>
              ) : (
                <div className="text-center text-gray-500 text-sm py-2">
                  Waiting for sales executive to be assigned...
                </div>
              )}
              <div className="text-center mt-2">
                <p className="text-[10px] text-gray-600">
                  {selectedPastDeal.salesExecutiveName 
                    ? `Chatting with ${selectedPastDeal.salesExecutiveName}`
                    : 'Powered by Tekion Intelligence AI'}
                </p>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
