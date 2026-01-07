import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Phone, Calendar, X, Send, 
  TrendingUp, TrendingDown, Minus, User, Car, 
  LayoutGrid, List, Search, Bell, Settings,
  LogOut, ChevronRight, MoreVertical,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { dealAPI, authAPI, chatAPI } from '../services/api';
import webSocketService from '../services/websocket';

// Tekion brand palette & extended colors
const COLORS = {
  primary: '#00D9FF', // Tekion cyan
  primaryGlow: 'rgba(0, 217, 255, 0.5)',
  dark: '#0f1115',
  cardBg: '#181b21',
  hover: '#1f232b',
  border: '#2a2f38',
  text: '#e0e0e0',
  muted: '#9ca3af',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
};

// Mock data with more detail
const INITIAL_CUSTOMERS = [
  { 
    id: 1, 
    name: 'John Smith', 
    model: 'Tesla Model 3', 
    price: '$45,000',
    health: 85, 
    stage: 'negotiation', 
    salesperson: 'Sarah Johnson', 
    avatar: 'https://i.pravatar.cc/150?u=1',
    messages: [
      { from: 'customer', text: 'Does this come with the long range battery?', time: new Date(Date.now() - 86400000) },
      { from: 'salesperson', text: 'Yes, this specific unit is the Long Range AWD model.', time: new Date(Date.now() - 86000000) }
    ], 
    lastContact: '2 hours ago',
    details: 'Interested in leasing. Credit score 750+.'
  },
  { 
    id: 2, 
    name: 'Emily Davis', 
    model: 'BMW X5', 
    price: '$68,500', 
    health: 45, 
    stage: 'lead', 
    salesperson: 'Mike Chen', 
    avatar: 'https://i.pravatar.cc/150?u=2',
    messages: [], 
    lastContact: '1 day ago',
    details: 'Looking for a family SUV. Comparing with Audi Q7.'
  },
  { 
    id: 3, 
    name: 'Robert Wilson', 
    model: 'Mercedes C-Class', 
    price: '$52,000', 
    health: 92, 
    stage: 'closed', 
    salesperson: 'Sarah Johnson', 
    avatar: 'https://i.pravatar.cc/150?u=3',
    messages: [], 
    lastContact: '30 mins ago',
    details: 'Ready to sign. Scheduled for financing review.'
  },
  { 
    id: 4, 
    name: 'Lisa Anderson', 
    model: 'Audi Q7', 
    price: '$72,000', 
    health: 25, 
    stage: 'lost', 
    salesperson: 'Mike Chen', 
    avatar: 'https://i.pravatar.cc/150?u=4',
    messages: [], 
    lastContact: '3 days ago',
    details: 'Found a better deal at another dealership.'
  },
  { 
    id: 5, 
    name: 'David Brown', 
    model: 'Porsche 911', 
    price: '$120,000', 
    health: 70, 
    stage: 'demo', 
    salesperson: 'Sarah Johnson', 
    avatar: 'https://i.pravatar.cc/150?u=5',
    messages: [], 
    lastContact: '5 hours ago',
    details: 'Enthusiast buyer. Wants to test drive the manual transmission.'
  },
];

// Utility Components
const CircularProgress = ({ value, size = 60, strokeWidth = 5, color = COLORS.primary }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          className="text-gray-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-xs font-bold text-white">{value}%</span>
    </div>
  );
};

const StatusBadge = ({ stage }) => {
  const styles = {
    lead: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    appointment: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    test_drive: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    negotiation: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    demo: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    finance: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    paperwork: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    delivery: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
    closed: 'bg-green-500/10 text-green-400 border-green-500/20',
    lost: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const labels = {
    lead: 'Target Lead',
    appointment: 'Appointment Scheduled',
    test_drive: 'Test Drive',
    negotiation: 'Negotiation',
    demo: 'Demo Drive',
    finance: 'Financial Inquiry',
    paperwork: 'Paperwork',
    delivery: 'Delivery',
    closed: 'Deal Closed',
    lost: 'Lost Deal'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[stage] || styles.lead}`}>
      {labels[stage] || stage}
    </span>
  );
};

const Sidebar = ({ activeTab, onTabChange, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { id: 'leads', icon: User, label: 'Leads' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'inventory', icon: Car, label: 'Inventory' },
  ];

  return (
    <div className="w-64 bg-[#0f1115] border-r border-[#2a2f38] flex flex-col h-full hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Car className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Auto<span className="text-[#00D9FF]">CRM</span></h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-[#00D9FF]/10 text-[#00D9FF]' 
                : 'text-gray-400 hover:bg-[#1f232b] hover:text-white'
            }`}
          >
            <item.icon size={20} className={activeTab === item.id ? 'text-[#00D9FF]' : 'group-hover:text-white'} />
            <span className="font-medium">{item.label}</span>
            {activeTab === item.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00D9FF] shadow-[0_0_8px_rgba(0,217,255,0.8)]" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#2a2f38]">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors w-full rounded-xl hover:bg-[#1f232b]"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

// Main Components
const InteractiveBar = ({ value, label = "Interest" }) => {
  const getColor = (v) => {
    if (v > 70) return COLORS.success;
    if (v > 40) return COLORS.warning;
    return COLORS.danger;
  };
  const color = getColor(value);
  
  return (
    <div className="w-full group">
      <div className="flex justify-between items-end mb-1">
        <span className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-white transition-colors tracking-wider">{label}</span>
        <span className="text-xs font-bold text-white group-hover:scale-110 transition-transform origin-right" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 w-full bg-[#181b21] rounded-full overflow-hidden flex gap-0.5 p-[1px] border border-[#2a2f38] group-hover:border-gray-600 transition-colors">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 rounded-[1px] transition-all duration-300 group-hover:scale-y-110 ${
              (value / 10) > i 
                ? 'opacity-100' 
                : 'opacity-20 bg-gray-700'
            }`}
            style={{ 
              backgroundColor: (value / 10) > i ? color : undefined,
              boxShadow: (value / 10) > i ? `0 0 4px ${color}` : 'none'
            }}
          />
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, icon: Icon, color }) => (
  <div className="bg-[#181b21] p-6 rounded-2xl border border-[#2a2f38] hover:border-[#3a414d] transition-colors relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20`}>
      <Icon size={48} color={color} />
    </div>
    <div className="relative z-10">
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
      <div className="flex items-center gap-2 text-xs">
        <span className={`${trend >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center gap-1 font-medium bg-white/5 px-1.5 py-0.5 rounded`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}%
        </span>
        <span className="text-gray-500">vs last week</span>
      </div>
    </div>
  </div>
);

const CustomerCard = ({ customer, onClick }) => (
  <div 
    onClick={() => onClick(customer)}
    className="bg-[#181b21] hover:bg-[#1f232b] p-5 rounded-xl border border-[#2a2f38] cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-cyan-900/10 group animate-in fade-in zoom-in-95 flex flex-col gap-4 relative"
  >
    {customer.hasUnreadMessages && (
      <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-[#181b21] animate-pulse" />
    )}
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-3">
        <img src={customer.avatar} alt={customer.name} className="w-10 h-10 rounded-full border-2 border-[#2a2f38]" />
        <div>
          <h3 className="text-white font-semibold group-hover:text-[#00D9FF] transition-colors">{customer.name}</h3>
          <p className="text-gray-400 text-xs">{customer.model}</p>
        </div>
      </div>
      <StatusBadge stage={customer.stage} />
    </div>

    <div className="bg-[#0f1115] rounded-xl p-3 border border-[#2a2f38]/50 space-y-3">
       <div className="flex justify-between items-center">
         <span className="text-xs text-gray-500">Deal Value</span>
         <span className="text-sm font-bold text-white">{customer.price}</span>
       </div>
       
       <InteractiveBar value={customer.health} label="Interest Level" />
    </div>

    <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
      <div className="flex items-center gap-1.5">
        <User size={12} />
        {customer.salesperson}
      </div>
      <span>{customer.lastContact}</span>
    </div>
  </div>
);

const CustomerDetailPanel = ({ customer, onClose, onAction }) => {
  if (!customer) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#181b21] shadow-2xl shadow-black border-l border-[#2a2f38] p-6 transform transition-transform duration-300 overflow-y-auto z-50">
      <div className="flex items-start justify-between mb-8">
        <button onClick={onClose} className="p-2 hover:bg-[#2a2f38] rounded-lg text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <div className="flex gap-2">
           <button className="p-2 hover:bg-[#2a2f38] rounded-lg text-gray-400 hover:text-white">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      <div className="text-center mb-8">
        <div className="relative inline-block mb-4">
          <img src={customer.avatar} alt={customer.name} className="w-24 h-24 rounded-full border-4 border-[#2a2f38]" />
          <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-[#181b21] ${customer.health > 70 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">{customer.name}</h2>
        <p className="text-[#00D9FF] font-medium">{customer.model}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-8">
        <button onClick={() => onAction('chat', customer)} className="flex flex-col items-center gap-2 p-3 bg-[#2a2f38]/50 hover:bg-[#2a2f38] rounded-xl text-gray-300 hover:text-white transition-all">
          <MessageCircle size={20} className="text-blue-400" />
          <span className="text-xs font-medium">Message</span>
        </button>
        <button onClick={() => onAction('call', customer)} className="flex flex-col items-center gap-2 p-3 bg-[#2a2f38]/50 hover:bg-[#2a2f38] rounded-xl text-gray-300 hover:text-white transition-all">
          <Phone size={20} className="text-green-400" />
          <span className="text-xs font-medium">Call</span>
        </button>
        <button onClick={() => onAction('meet', customer)} className="flex flex-col items-center gap-2 p-3 bg-[#2a2f38]/50 hover:bg-[#2a2f38] rounded-xl text-gray-300 hover:text-white transition-all">
          <Calendar size={20} className="text-purple-400" />
          <span className="text-xs font-medium">Schedule</span>
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Deal Details</h4>
          <div className="bg-[#0f1115] rounded-xl p-4 space-y-3">
             <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Stage</span>
              <StatusBadge stage={customer.stage} />
            </div>
            {customer.dealData?.appointmentDate && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Appointment</span>
                <span className="text-white text-sm font-medium">
                  {new Date(customer.dealData.appointmentDate).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Budget</span>
              <span className="text-white text-sm font-medium">{customer.price}</span>
            </div>
            <div className="pt-2">
              <InteractiveBar value={customer.health} label="Win Probability" />
            </div>
            {customer.dealData?.homeTestDriveOffered && (
              <div className="text-xs text-[#00D9FF] border border-[#00D9FF]/20 bg-[#00D9FF]/10 rounded-lg px-3 py-2">
                Customer eligible: free home test drive
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Recent Activity</h4>
          <div className="space-y-4">
             {/* Activity feed will be populated from real backend events */}
             <div className="text-center py-6 text-gray-600 text-sm">
               No recent activity
             </div>
          </div>
        </div>
        
        {(customer.stage === 'lost' || customer.stage === 'closed') && (
          <div className="mt-8">
            <button 
              onClick={() => onAction('loss_analysis', customer)}
              className={`w-full py-3 rounded-xl transition-all font-medium text-sm ${
                customer.stage === 'closed'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'
                  : 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'
              }`}
            >
              Give Feedback
            </button>
          </div>
        )}

        {customer.stage !== 'lost' && customer.stage !== 'closed' && (
          <div className="mt-2 space-y-2">
            <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Stage Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAction('stage', { customer, status: 'TEST_DRIVE' })}
                className="py-2 rounded-xl bg-[#2a2f38]/50 hover:bg-[#2a2f38] border border-[#2a2f38] text-gray-200 text-xs"
              >
                Test Drive
              </button>
              <button
                onClick={() => onAction('stage', { customer, status: 'FINANCIAL_INQUIRY' })}
                className="py-2 rounded-xl bg-[#2a2f38]/50 hover:bg-[#2a2f38] border border-[#2a2f38] text-gray-200 text-xs"
              >
                Finance
              </button>
              <button
                onClick={() => onAction('stage', { customer, status: 'PAPERWORK' })}
                className="py-2 rounded-xl bg-[#2a2f38]/50 hover:bg-[#2a2f38] border border-[#2a2f38] text-gray-200 text-xs"
              >
                Paperwork
              </button>
              <button
                onClick={() => onAction('stage', { customer, status: 'DELIVERY' })}
                className="py-2 rounded-xl bg-[#2a2f38]/50 hover:bg-[#2a2f38] border border-[#2a2f38] text-gray-200 text-xs"
              >
                Delivery
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAction('complete', customer)}
                className="py-2 rounded-xl bg-green-500/10 hover:bg-green-500 border border-green-500/20 text-green-400 hover:text-white text-xs"
              >
                Complete
              </button>
              <button
                onClick={() => onAction('fail', customer)}
                className="py-2 rounded-xl bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-400 hover:text-white text-xs"
              >
                Fail
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Analytics Components
const Sparkline = ({ data, color, fill }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-10 w-24 overflow-hidden relative">
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
        {fill && (
           <path
            d={`M 0,100 L ${points.split(' ').join(' L ')} L 100,100 Z`}
            fill={color}
            fillOpacity="0.1"
            stroke="none"
          />
        )}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

const ActivityHeatmap = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const times = ['Morning', 'Afternoon', 'Evening', 'Night'];
    return (
        <div className="bg-[#181b21] border border-[#2a2f38] rounded-2xl p-6 h-full">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
                <span>Contact Heatmap</span>
            </h3>
            <div className="grid grid-cols-[auto_repeat(4,1fr)] gap-2 h-full">
                <div className="h-4"></div>
                {times.map(t => <div key={t} className="text-[10px] text-gray-500 text-center uppercase tracking-wider">{t}</div>)}
                {days.map((day, i) => (
                    <React.Fragment key={day}>
                         <div className="text-xs text-gray-400 font-medium self-center pr-2">{day}</div>
                         {times.map((t, j) => {
                             const intensity = (Math.sin(i * j + i) + 1) / 2; // Deterministic mock data
                             const getHeatColor = (val) => {
                                 if (val > 0.8) return 'bg-[#00D9FF] shadow-[0_0_8px_rgba(0,217,255,0.6)]';
                                 if (val > 0.6) return 'bg-[#00D9FF]/70';
                                 if (val > 0.4) return 'bg-[#00D9FF]/40';
                                 if (val > 0.2) return 'bg-[#00D9FF]/20';
                                 return 'bg-[#2a2f38]';
                             };
                             return (
                                 <div 
                                    key={`${day}-${t}`} 
                                    className={`h-6 rounded-sm transition-all duration-300 hover:scale-110 hover:z-10 cursor-help ${getHeatColor(intensity)}`}
                                 />
                             );
                         })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

const RecentLeadsTable = ({ customers }) => (
    <div className="bg-[#181b21] border border-[#2a2f38] rounded-2xl overflow-hidden col-span-2">
        <div className="p-6 border-b border-[#2a2f38] flex justify-between items-center bg-[#0f1115]/50">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <List size={20} className="text-[#00D9FF]" />
                Recent Leads
            </h3>
            <button className="text-xs text-[#00D9FF] hover:text-[#00D9FF]/80 font-medium border border-[#00D9FF]/20 px-3 py-1.5 rounded-lg hover:bg-[#00D9FF]/10 transition-colors">View All</button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-[#2a2f38] text-xs text-gray-500 uppercase bg-[#0f1115]/30">
                        <th className="p-4 font-medium pl-6">Lead Name</th>
                        <th className="p-4 font-medium">Interest</th>
                        <th className="p-4 font-medium">Source</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right pr-6">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2f38]">
                    {customers.slice(0, 5).map((c, i) => (
                        <tr key={c.id} className="hover:bg-[#1f232b] transition-colors group">
                           <td className="p-4 pl-6">
                               <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold text-white border border-[#2a2f38]">
                                       {c.name.charAt(0)}
                                   </div>
                                   <div>
                                       <div className="text-white font-medium text-sm group-hover:text-[#00D9FF] transition-colors">{c.name}</div>
                                       <div className="text-gray-500 text-[10px]">{c.lastContact}</div>
                                   </div>
                               </div>
                           </td>
                           <td className="p-4 text-sm text-gray-300">
                               <div className="flex flex-col">
                                   <span className="text-white text-xs font-medium">{c.model}</span> 
                                   <div className="w-20 h-1 bg-[#2a2f38] rounded-full mt-1 overflow-hidden">
                                       <div className="h-full bg-gradient-to-r from-[#00D9FF] to-blue-500" style={{ width: `${c.health}%` }}></div>
                                   </div>
                               </div>
                           </td>
                           <td className="p-4">
                               <span className="px-2 py-1 rounded bg-[#2a2f38] text-[10px] text-gray-400 border border-[#2a2f38]">Online</span>
                           </td>
                           <td className="p-4">
                               <StatusBadge stage={c.stage} />
                           </td>
                           <td className="p-4 text-right pr-6">
                               <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button className="p-1.5 text-gray-400 hover:text-[#00D9FF] hover:bg-[#00D9FF]/10 rounded-lg transition-all">
                                       <MessageCircle size={14} />
                                   </button>
                                   <button className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-all">
                                       <Phone size={14} />
                                   </button>
                               </div>
                           </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// Leads View Component
const LeadsView = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'New Leads Today', value: 12, change: '+20%', color: COLORS.primary, data: [4, 6, 3, 5, 4, 8, 9, 12] },
          { label: 'Response Rate', value: '85%', change: '+5%', color: COLORS.success, data: [70, 72, 75, 71, 78, 82, 85, 85] },
          { label: 'Avg. Response Time', value: '14m', change: '-2m', color: COLORS.warning, data: [20, 18, 15, 12, 16, 15, 14, 14] },
          { label: 'Conversion Rate', value: '2.4%', change: '+0.1%', color: COLORS.text, data: [1.8, 2.0, 2.1, 1.9, 2.2, 2.3, 2.4, 2.4] }
        ].map((stat, i) => (
           <div key={i} className="bg-[#181b21] border border-[#2a2f38] p-5 rounded-2xl group hover:border-[#00D9FF]/30 transition-all hover:translate-y-[-2px] hover:shadow-lg hover:shadow-[#00D9FF]/5 relative overflow-hidden">
             <div className="flex justify-between items-start mb-4 relative z-10">
                 <div>
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                        {stat.label}
                    </div>
                    <div className="text-3xl font-bold text-white tracking-tight">{stat.value}</div>
                 </div>
                 <div className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${stat.change.includes('+') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {stat.change.includes('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {stat.change}
                 </div>
             </div>
             <div className="flex items-end justify-between relative z-10">
                 <div className="text-xs text-gray-500 font-medium">Last 7 Days</div>
                 <Sparkline data={stat.data} color={stat.color} fill={true} />
             </div>
             {/* Decor BG */}
             <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl group-hover:from-[#00D9FF]/10 transition-colors pointer-events-none"></div>
           </div>
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline */}
        <div className="lg:col-span-2 bg-[#181b21] border border-[#2a2f38] rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5">
                <TrendingUp size={120} />
            </div>
            <div className="flex justify-between items-center mb-8 relative z-10">
                 <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp size={20} className="text-[#00D9FF]" />
                    Pipeline Velocity
                </h3>
                <div className="flex gap-2">
                     <button className="p-1.5 hover:bg-[#2a2f38] rounded text-gray-400 hover:text-white"><Settings size={16} /></button>
                </div>
            </div>

            <div className="space-y-7 relative z-10">
                {[
                    { label: 'New Inquiry', count: 45, color: COLORS.primary, conversion: '65%' },
                    { label: 'Engaged', count: 32, color: COLORS.primary, conversion: '40%' },
                    { label: 'Test Drive', count: 18, color: COLORS.warning, conversion: '32%' },
                    { label: 'Negotiation', count: 8, color: COLORS.warning, conversion: '80%' },
                    { label: 'Deal Closed', count: 12, color: COLORS.success, conversion: '100%' },
                ].map((item, i) => (
                    <div key={i} className="group cursor-pointer">
                        <div className="flex justify-between text-sm mb-2 px-1">
                             <div className="flex items-center gap-2">
                                 <span className="w-2 h-2 rounded-full" style={{ background: item.color }}></span>
                                 <span className="text-white font-medium group-hover:text-[#00D9FF] transition-colors">{item.label}</span>
                             </div>
                             <div className="flex items-center gap-4">
                                <span className="text-gray-500 text-xs text-right opacity-0 group-hover:opacity-100 transition-opacity">Conv: {item.conversion}</span>
                                <span className="text-white font-bold">{item.count}</span>
                             </div>
                        </div>
                        <div className="h-2.5 bg-[#0f1115] rounded-full overflow-hidden flex shadow-inner border border-[#2a2f38]/50">
                            <div 
                                className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110 relative overflow-hidden"
                                style={{ 
                                    width: `${(item.count / 45) * 100}%`, 
                                    backgroundColor: item.color,
                                    boxShadow: `0 0 12px ${item.color}60`
                                }}
                            >
                                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Source Breakdown */}
        <div className="bg-[#181b21] border border-[#2a2f38] rounded-2xl p-6 flex flex-col justify-between">
            <h3 className="text-lg font-bold text-white mb-2">Lead Sources</h3>
            <div className="flex-1 flex items-center justify-center py-4 relative">
                 <div className="w-48 h-48 rounded-full border-8 border-[#181b21] shadow-[0_0_0_1px_#2a2f38] relative z-0" 
                      style={{ 
                          background: `conic-gradient(
                            ${COLORS.primary} 0% 40%, 
                            ${COLORS.success} 40% 65%, 
                            ${COLORS.warning} 65% 85%, 
                            ${COLORS.danger} 85% 100%
                          )` 
                      }}>
                      <div className="absolute inset-0 rounded-full border-4 border-[#181b21] mix-blend-multiply opacity-50"></div>
                 </div>
                 <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                       <div className="w-32 h-32 bg-[#181b21] rounded-full flex flex-col items-center justify-center border border-[#2a2f38] shadow-2xl">
                          <span className="text-3xl font-bold text-white">115</span>
                          <span className="text-gray-500 text-[10px] bg-[#2a2f38] px-2 py-0.5 rounded-full mt-1">Total Leads</span>
                       </div>
                 </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                    { label: 'AutoTrader', val: '40%', color: COLORS.primary },
                    { label: 'Website', val: '25%', color: COLORS.success },
                    { label: 'Walk-ins', val: '20%', color: COLORS.warning },
                    { label: 'Socials', val: '15%', color: COLORS.danger },
                ].map((s,i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2.5 bg-[#0f1115]/50 border border-[#2a2f38] rounded-lg hover:border-[#00D9FF]/30 transition-colors">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ color: s.color, backgroundColor: s.color }} />
                            <span className="text-gray-400">{s.label}</span>
                        </div>
                        <span className="text-white font-mono">{s.val}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

        {/* Lower Grid: Heatmap & Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <ActivityHeatmap />
            <RecentLeadsTable customers={INITIAL_CUSTOMERS} />
        </div>
    </div>
  );
};

// Inventory Data
const INVENTORY_DATA = [
  { id: 101, model: 'Tesla Model S Plaid', year: 2024, price: '$89,990', color: 'Ultra Red', status: 'In Stock', type: 'Sedan', mileage: '15 mi', vin: '5YJSA...', image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800' },
  { id: 102, model: 'Porsche 911 GT3', year: 2023, price: '$169,700', color: 'Shark Blue', status: 'Reserved', type: 'Coupe', mileage: '420 mi', vin: 'WP0A...', image: 'https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&q=80&w=800' },
  { id: 103, model: 'Mercedes-AMG G63', year: 2024, price: '$179,000', color: 'Obsidian Black', status: 'In Stock', type: 'SUV', mileage: '50 mi', vin: 'W1N...', image: 'https://images.unsplash.com/photo-1520031441872-ddb15027e498?auto=format&fit=crop&q=80&w=800' },
  { id: 104, model: 'BMW M4 Competition', year: 2023, price: '$82,200', color: 'Sao Paulo Yellow', status: 'In Transit', type: 'Coupe', mileage: '0 mi', vin: 'WBS...', image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80&w=800' },
  { id: 105, model: 'Audi RS e-tron GT', year: 2024, price: '$147,100', color: 'Kemora Gray', status: 'In Stock', type: 'EV', mileage: '25 mi', vin: 'WA1...', image: 'https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?auto=format&fit=crop&q=80&w=800' },
  { id: 106, model: 'Range Rover SV', year: 2024, price: '$234,000', color: 'Sunset Gold', status: 'Low Stock', type: 'SUV', mileage: '10 mi', vin: 'SAL...', image: 'https://images.unsplash.com/photo-1606220838315-056192d5e927?auto=format&fit=crop&q=80&w=800' },
];

const InventoryView = () => {
    const [filter, setFilter] = useState('All');
    
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Inventory Header Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#181b21] border border-[#2a2f38] p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-[#00D9FF]/10 rounded-lg">
                        <Car size={24} className="text-[#00D9FF]" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase">Total Units</p>
                        <p className="text-2xl font-bold text-white">428</p>
                    </div>
                </div>
                 <div className="bg-[#181b21] border border-[#2a2f38] p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                        <CheckCircle2 size={24} className="text-green-500" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase">Available</p>
                        <p className="text-2xl font-bold text-white">312</p>
                    </div>
                </div>
                 <div className="bg-[#181b21] border border-[#2a2f38] p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-lg">
                        <AlertCircle size={24} className="text-yellow-500" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase">Low Stock</p>
                        <p className="text-2xl font-bold text-white">14</p>
                    </div>
                </div>
                 <div className="bg-[#181b21] border border-[#2a2f38] p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                        <TrendingUp size={24} className="text-purple-500" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase">Avg Days on Lot</p>
                        <p className="text-2xl font-bold text-white">24</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
                {['All', 'SUV', 'Sedan', 'Coupe', 'EV'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                            filter === f 
                            ? 'bg-[#00D9FF] text-black shadow-[0_0_15px_rgba(0,217,255,0.4)]' 
                            : 'bg-[#181b21] text-gray-400 border border-[#2a2f38] hover:border-gray-500 hover:text-white'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Car Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {INVENTORY_DATA.filter(c => filter === 'All' || c.type === filter).map(car => (
                    <div key={car.id} className="group relative bg-[#181b21] rounded-3xl overflow-hidden border border-[#2a2f38] hover:border-[#00D9FF]/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,217,255,0.1)]">
                        {/* Image Container with Zoom Effect */}
                        <div className="h-48 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#181b21] via-transparent to-transparent z-10 opactiy-60" />
                            <img 
                                src={car.image} 
                                alt={car.model} 
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                            />
                            <div className="absolute top-4 right-4 z-20">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${
                                    car.status === 'In Stock' 
                                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                        : car.status === 'Reserved'
                                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                        : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                }`}>
                                    {car.status}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 relative z-20 -mt-6">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{car.year} • {car.type}</p>
                                    <h3 className="text-xl font-bold text-white group-hover:text-[#00D9FF] transition-colors">{car.model}</h3>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 my-4 text-sm text-gray-400">
                                <div className="flex items-center gap-1.5 bg-[#0f1115] px-2.5 py-1 rounded-md">
                                    <div className="w-2 h-2 rounded-full bg-gray-600" />
                                    {car.mileage}
                                </div>
                                <div className="flex items-center gap-1.5 bg-[#0f1115] px-2.5 py-1 rounded-md">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: car.color === 'Ultra Red' ? '#ef4444' : car.color === 'Shark Blue' ? '#3b82f6' : '#9ca3af' }} />
                                    {car.color}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-[#2a2f38]">
                                <div className="text-2xl font-bold text-white">{car.price}</div>
                                <button className="p-2 rounded-xl bg-[#2a2f38] text-white hover:bg-[#00D9FF] hover:text-black transition-all transform group-hover:translate-x-1">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function CarDealershipCRM({ onLogout, onNavigate }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatDeal, setActiveChatDeal] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [notifications, setNotifications] = useState([]); // In-app notifications
  
  const currentUser = authAPI.getCurrentUser();
  const hasFetchedDeals = useRef(false);
  const wsInitialized = useRef(false);
  const activeChatDealRef = useRef(null); // Ref to track active chat deal for WebSocket callback

  // Keep ref in sync with state
  useEffect(() => {
    activeChatDealRef.current = activeChatDeal;
  }, [activeChatDeal]);

  // Show in-app notification
  const showNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now() + Math.random(), // Make truly unique
      message,
      type // 'info', 'success', 'warning'
    };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Fetch deals on component mount and request notification permission
  useEffect(() => {
    if (currentUser?.id && !hasFetchedDeals.current) {
      hasFetchedDeals.current = true;
      fetchDeals();
      
      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        });
      }
    }
  }, []); // Empty dependency - run only once on mount

  // Initialize WebSocket immediately upon mount (don't wait for deals)
  useEffect(() => {
    if (currentUser?.id && !wsInitialized.current) {
      wsInitialized.current = true;
      initializeWebSocket();
    }

    return () => {
      // Cleanup WebSocket subscriptions
      deals.forEach(deal => {
        webSocketService.unsubscribeFromDealChat(deal.id);
      });
      // Disconnect WebSocket
      webSocketService.disconnect();
    };
  }, []); // Empty dependency - run only once on mount

  // Subscribe to new deals' chats when deals are loaded or updated
  useEffect(() => {
    if (webSocketService.isConnected() && deals.length > 0) {
      deals.forEach(deal => {
        if (deal.id && !webSocketService.subscriptions.has(`/topic/chat/${deal.id}`)) {
          webSocketService.subscribeToDealChat(deal.id, handleIncomingMessage);
        }
      });
    }
  }, [deals.length]); // Subscribe when deals change

  const initializeWebSocket = async () => {
    try {
      await webSocketService.connect(
        (frame) => {
          console.log('Sales dashboard WebSocket connected');
          
          // Subscribe to new customer notifications for the logged-in sales executive
          const salesExecutiveId = currentUser?.id;
          if (!salesExecutiveId) {
            console.warn('No sales executive ID available for WebSocket subscription');
            return;
          }
          
          console.log(`Subscribing to new customer notifications for SE ID: ${salesExecutiveId}`);
          webSocketService.stompClient.subscribe(`/topic/sales-executive/${salesExecutiveId}/new-customer`, (message) => {
              try {
                const newDeal = JSON.parse(message.body);
                console.log('New customer assigned:', newDeal);
                
                // Show browser notification if permitted
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('New Customer Assigned!', {
                    body: `${newDeal.customerName || 'A new customer'} is interested in ${newDeal.interestCategory || 'a vehicle'}`,
                    icon: '/favicon.ico'
                  });
                }
                
                // Add new deal to the list
                const transformedDeal = {
                  id: newDeal.id,
                  name: newDeal.customerName || newDeal.customer?.name || 'New Customer',
                  model: newDeal.interestCategory || 'Vehicle',
                  price: newDeal.budgetRange || 'N/A',
                  health: calculateDealHealth(newDeal),
                  stage: mapDealStatus(newDeal.status),
                  salesperson: currentUser?.name || 'You',
                  avatar: `https://i.pravatar.cc/150?u=${newDeal.customerId || newDeal.id}`,
                  messages: [],
                  lastContact: 'Just now',
                  details: `Budget: ${newDeal.budgetRange}, Timeline: ${newDeal.intendedTimeframe}`,
                  dealData: newDeal,
                  hasUnreadMessages: true
                };
                
                setDeals(prev => [transformedDeal, ...prev]);
                
                // Show in-app notification
                showNotification(`New customer: ${transformedDeal.name} - ${transformedDeal.model}`, 'success');
                
                // Subscribe to new deal's chat
                webSocketService.subscribeToDealChat(newDeal.id, handleIncomingMessage);
              } catch (error) {
                console.error('Error parsing new customer notification:', error);
              }
            });

          // Subscribe to deal health updates for this sales executive
          webSocketService.subscribeToSalesExecutiveDealHealth(salesExecutiveId, (updatedDeal) => {
            handleDealHealthUpdate(updatedDeal);
          });
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
    console.log('Sales dashboard received message:', message);
    
    const senderType = (message.senderType || '').toLowerCase();
    
    // Ignore our own messages (already added locally when sent)
    if (senderType === 'sales_executive') {
      console.log('Ignoring own message');
      return;
    }
    
    // Update chat messages if chat is open (only customer messages)
    // Use ref to get current activeChatDeal value (avoids stale closure)
    const currentActiveDeal = activeChatDealRef.current;
    console.log('Active chat deal:', currentActiveDeal?.id, 'Message dealId:', message.dealId);
    
    if (currentActiveDeal && message.dealId === currentActiveDeal.id) {
      console.log('Adding message to chat UI');
      setChatMessages(prev => [...prev, {
        id: message.id || Date.now(),
        from: 'customer',
        text: message.message || message.content,
        senderName: message.senderName,
        timestamp: new Date(message.timestamp || Date.now())
      }]);
    }
    
    // Show notification badge for new customer messages
    // Update deal to show unread indicator
    setDeals(prev => prev.map(deal => 
      deal.id === message.dealId 
        ? { ...deal, hasUnreadMessages: true }
        : deal
    ));
  };

  const handleDealHealthUpdate = (updatedDeal) => {
    if (!updatedDeal?.id) return;

    setDeals(prev => prev.map(d => {
      if (d.id !== updatedDeal.id) return d;
      return {
        ...d,
        health: calculateDealHealth(updatedDeal),
        stage: mapDealStatus(updatedDeal.status),
        lastContact: formatLastContact(updatedDeal.updatedAt),
        dealData: updatedDeal
      };
    }));

    const currentActive = activeChatDealRef.current;
    if (currentActive?.id === updatedDeal.id) {
      setActiveChatDeal(prev => prev ? ({
        ...prev,
        health: calculateDealHealth(updatedDeal),
        stage: mapDealStatus(updatedDeal.status),
        dealData: updatedDeal
      }) : prev);
    }
  };

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const salesExecutiveId = currentUser?.id;
      if (!salesExecutiveId) {
        console.warn('No salesExecutiveId found for current user; cannot load deals');
        setDeals([]);
        return;
      }
      const response = await dealAPI.getSalesExecutiveDeals(salesExecutiveId);
      console.log('Fetched deals:', response);
      
      // Transform backend deals to match UI format
      const transformedDeals = response.map(deal => ({
        id: deal.id,
        name: deal.customerName || deal.customer?.name || 'Unknown Customer',
        model: deal.interestCategory || 'Vehicle',
        price: deal.budgetRange || 'N/A',
        health: calculateDealHealth(deal),
        stage: mapDealStatus(deal.status),
        salesperson: currentUser?.name || 'You',
        avatar: `https://i.pravatar.cc/150?u=${deal.customerId || deal.customer?.id || deal.id}`,
        messages: [],
        lastContact: formatLastContact(deal.updatedAt),
        details: `Budget: ${deal.budgetRange}, Timeline: ${deal.intendedTimeframe}`,
        dealData: deal, // Store original deal data
        hasUnreadMessages: false
      }));
      
      setDeals(transformedDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      // Fallback to mock data if backend is not available
      setDeals(INITIAL_CUSTOMERS);
    } finally {
      setLoading(false);
    }
  };

  const calculateDealHealth = (deal) => {
    const hs = deal?.healthScore;
    if (typeof hs === 'number' && !Number.isNaN(hs)) {
      return Math.max(0, Math.min(100, Math.round(hs)));
    }
    if (deal?.status === 'CLOSED' || deal?.status === 'CONVERTED') return 95;
    if (deal?.status === 'LOST') return 10;
    return 50;
  };

  const mapDealStatus = (status) => {
    const statusMap = {
      'ACTIVE': 'lead',
      'INITIATED': 'lead',
      'IN_PROGRESS': 'negotiation',
      'APPOINTMENT_SCHEDULED': 'appointment',
      'TEST_DRIVE': 'test_drive',
      'FINANCIAL_INQUIRY': 'finance',
      'PAPERWORK': 'paperwork',
      'DELIVERY': 'delivery',
      'CLOSED': 'closed',
      'CONVERTED': 'closed',
      'LOST': 'lost'
    };
    return statusMap[status] || 'lead';
  };

  const formatLastContact = (dateString) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const openChat = async (deal) => {
    try {
      setActiveChatDeal(deal);
      
      // Fetch existing chat messages
      const chats = await chatAPI.getSalesChat(deal.id);
      console.log('Fetched chat messages:', chats);
      
      // Ensure chats is an array
      const chatsArray = Array.isArray(chats) ? chats : (chats ? [chats] : []);
      
      // Transform messages to UI format
      const transformedMessages = chatsArray.flatMap(chat => 
        (chat.messages || []).map(msg => ({
          id: msg.id || Date.now() + Math.random(),
          from: msg.senderType === 'SALES_EXECUTIVE' ? 'salesperson' : 'customer',
          text: msg.content,
          senderName: msg.senderName,
          timestamp: new Date(msg.timestamp)
        }))
      );
      
      setChatMessages(transformedMessages);
      
      // Mark as read
      setDeals(prev => prev.map(d => 
        d.id === deal.id ? { ...d, hasUnreadMessages: false } : d
      ));
      
      // Subscribe to this deal if not already subscribed
      if (!webSocketService.isConnected()) {
        await initializeWebSocket();
      } else {
        webSocketService.subscribeToDealChat(deal.id, handleIncomingMessage);
      }
    } catch (error) {
      console.error('Error opening chat:', error);
    }
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatDeal) return;

    const message = {
      dealId: activeChatDeal.id,
      senderId: currentUser?.id,
      senderName: currentUser?.name || 'Sales Executive',
      senderType: 'sales_executive',
      content: chatInput.trim()
    };

    // Send via WebSocket
    const sent = webSocketService.sendMessage(activeChatDeal.id, message);
    
    if (sent) {
      // Add to local messages
      setChatMessages(prev => [...prev, {
        id: Date.now() + Math.random(), // Unique ID
        from: 'salesperson',
        text: chatInput.trim(),
        senderName: message.senderName,
        timestamp: new Date()
      }]);
      
      setChatInput('');
    }
  };

  const closeChat = () => {
    setActiveChatDeal(null);
    setChatMessages([]);
  };

  // Dashboard Stats
  const stats = [
    { title: 'Total Leads', value: deals.length.toString(), trend: 12, icon: User, color: '#00D9FF' },
    { title: 'Active Deals', value: deals.filter(d => d.stage !== 'closed' && d.stage !== 'lost').length.toString(), trend: 4.5, icon: Car, color: '#10b981' },
    { title: 'Closed Deals', value: deals.filter(d => d.stage === 'closed').length.toString(), trend: -2.3, icon: TrendingUp, color: '#f59e0b' },
  ];

  const handleAction = (action, customer) => {
    console.log(`Action: ${action} for ${customer.name}`);
    
    if (action === 'chat') {
      openChat(customer);
    } else if (action === 'loss_analysis' && onNavigate) {
      onNavigate('feedback', customer);
    } else if (action === 'stage') {
      const { customer: c, status } = customer;
      const dealId = c?.id;
      if (!dealId || !status) return;
      dealAPI.updateDealStage(dealId, status)
        .then((updated) => handleDealHealthUpdate(updated))
        .catch((e) => console.error('Failed to update stage:', e));
    } else if (action === 'complete') {
      const dealId = customer?.id;
      if (!dealId) return;
      dealAPI.completeDeal(dealId)
        .then((updated) => {
          handleDealHealthUpdate(updated);
          if (onNavigate) onNavigate('feedback', { ...customer, dealData: updated });
        })
        .catch((e) => console.error('Failed to complete deal:', e));
    } else if (action === 'fail') {
      const dealId = customer?.id;
      if (!dealId) return;
      dealAPI.failDeal(dealId)
        .then((updated) => {
          handleDealHealthUpdate(updated);
          if (onNavigate) onNavigate('feedback', { ...customer, dealData: updated });
        })
        .catch((e) => console.error('Failed to fail deal:', e));
    }
  };

  const filteredCustomers = deals.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#0f1115] text-white">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={onLogout} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* In-app Notifications */}
        <div className="absolute top-20 right-8 z-50 flex flex-col gap-2">
          {notifications.map(notif => (
            <div 
              key={notif.id}
              className={`p-4 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300 min-w-[300px] bg-[#181b21] border ${
                notif.type === 'success' ? 'border-green-500/50 text-white' : 'border-[#00D9FF]/50 text-white'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${notif.type === 'success' ? 'bg-green-500' : 'bg-[#00D9FF]'}`} />
              <p className="text-sm font-medium">{notif.message}</p>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="ml-auto text-gray-500 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Header */}
        <header className="h-16 border-b border-[#2a2f38] flex items-center justify-between px-8 bg-[#0f1115]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text"
                placeholder="Search customers, models, or deals..."
                className="w-full bg-[#181b21] border border-[#2a2f38] text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF] transition-all placeholder:text-gray-600 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#0f1115]" />
            </button>
            <div className="w-px h-6 bg-[#2a2f38]" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">Alex Morgan</p>
                <p className="text-xs text-gray-500">Sales Manager</p>
              </div>
              <img src="https://i.pravatar.cc/150?u=a" alt="User" className="w-9 h-9 rounded-lg border border-[#2a2f38]" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                  <StatCard key={idx} {...stat} />
                ))}
              </div>

              {/* Active Deals Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Active Opportunities 
                    <span className="bg-[#2a2f38] text-gray-400 text-xs px-2 py-0.5 rounded-full">{filteredCustomers.length}</span>
                  </h2>
                  <div className="flex items-center bg-[#181b21] p-1 rounded-lg border border-[#2a2f38]">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#2a2f38] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      <LayoutGrid size={18} />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-[#2a2f38] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      <List size={18} />
                    </button>
                  </div>
                </div>

                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {filteredCustomers.map(customer => (
                    <CustomerCard 
                      key={customer.id} 
                      customer={customer} 
                      onClick={setSelectedCustomer} 
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

           {activeTab === 'leads' ? (
             <LeadsView />
           ) : activeTab === 'inventory' ? (
             <InventoryView />
           ) : activeTab !== 'dashboard' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
               <Settings size={48} className="mb-4 opacity-20" />
               <p className="text-lg">Module under development</p>
            </div>
          )}
        </main>
      </div>

       {/* Slide-over Detail Panel */}
      {selectedCustomer && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedCustomer(null)}
          />
          <CustomerDetailPanel 
            customer={selectedCustomer} 
            onClose={() => setSelectedCustomer(null)}
            onAction={handleAction}
          />
        </>
      )}

      {/* Chat Modal */}
      {activeChatDeal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0f1115] rounded-3xl shadow-2xl border border-[#2a2f38] flex flex-col h-[80vh] overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-[#2a2f38] flex items-center justify-between bg-[#181b21]">
              <div className="flex items-center gap-3">
                <img 
                  src={activeChatDeal.avatar} 
                  alt={activeChatDeal.name} 
                  className="w-10 h-10 rounded-full border-2 border-[#2a2f38]"
                />
                <div>
                  <h3 className="text-white font-bold text-sm">{activeChatDeal.name}</h3>
                  <p className="text-[#00D9FF] text-xs">{activeChatDeal.model} • {activeChatDeal.price}</p>
                </div>
              </div>
              <button 
                onClick={closeChat}
                className="p-2 hover:bg-[#2a2f38] text-gray-400 hover:text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageCircle size={48} className="mb-4 opacity-20" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.from === 'salesperson' ? 'justify-end' : 'justify-start'}`}>
                    {msg.from === 'customer' && (
                      <div className="w-8 h-8 rounded-full bg-[#1f232b] flex items-center justify-center mr-2 mt-auto border border-[#2a2f38] shrink-0">
                        <User size={14} className="text-[#00D9FF]" />
                      </div>
                    )}
                    <div className={`max-w-[70%]`}>
                      {msg.from === 'customer' && (
                        <div className="text-xs text-gray-400 mb-1 ml-1">{msg.senderName}</div>
                      )}
                      <div className={`p-3 text-sm rounded-2xl ${
                        msg.from === 'salesperson'
                          ? 'bg-[#00D9FF] text-black font-medium rounded-tr-sm'
                          : 'bg-[#2a2f38] text-gray-200 border border-[#3a414d] rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-1 ml-1">
                        {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-[#181b21] border-t border-[#2a2f38]">
              <form onSubmit={sendChatMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your message..." 
                  className="flex-1 bg-[#0f1115] border border-[#2a2f38] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF]"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-3 bg-[#00D9FF] text-black rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
