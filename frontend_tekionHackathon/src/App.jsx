import { useState, Component, useEffect } from 'react'
import './App.css'
import CRM from './component/CRM'
import CustomerChatbot from './component/CustomerChatbot'
import TekionCRMLogin from './component/TekionCRMLogin'
import FeedbackForm from './component/FeedbackForm'
import { MessageSquare } from 'lucide-react'
import { authAPI } from './services/api'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-red-500 p-10 font-mono">
          <h1 className="text-3xl font-bold mb-4">Something went wrong.</h1>
          <div className="bg-black p-6 rounded-lg border border-red-900 overflow-auto">
            <h2 className="text-xl text-red-400 mb-2">{this.state.error && this.state.error.toString()}</h2>
            <pre className="text-sm text-gray-400 whitespace-pre-wrap">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [currentView, setCurrentView] = useState('login'); // login, crm, chatbot, feedback
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // For feedback form

  // Check for existing session on mount
  useEffect(() => {
    const user = authAPI.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      // Route based on user type
      const normalizedType = (user.userType || '').toLowerCase();
      if (normalizedType === 'customer') {
        setCurrentView('chatbot');
      } else {
        setCurrentView('crm');
      }
    }
  }, []);

  const handleLogin = (userType, userData) => {
    console.log('Login successful:', { userType, userData });
    setCurrentUser({ ...userData, type: userType });
    
    // Route based on actual user type from backend response
    const actualUserType = userData.userType || userType;
    const normalizedType = String(actualUserType).toLowerCase();
    
    if (normalizedType === 'customer') {
      setCurrentView('chatbot');
    } else {
      setCurrentView('crm');
    }
  };

  const crmLogout = () => {
    authAPI.logout();
    setCurrentUser(null);
    setCurrentView('login');
  };

  const handleCrmNavigate = (target, data) => {
    if (target === 'feedback') {
        setSelectedCustomer(data);
        setCurrentView('feedback');
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-white font-sans selection:bg-[#00D9FF] selection:text-black">
        
        {/* Render Logic */}
        {currentView === 'login' && (
            <TekionCRMLogin onLogin={handleLogin} />
        )}

        {currentView === 'crm' && (
            <CRM onLogout={crmLogout} onNavigate={handleCrmNavigate} />
        )}

        {currentView === 'chatbot' && (
             <div className="relative min-h-screen w-full bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center animate-in fade-in duration-700">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"></div>
            
            {/* Customer Landing Page Content */}
            <div className="relative z-10 p-10 flex flex-col justify-center h-screen max-w-4xl mx-auto">
              <h1 className="text-6xl font-black italic tracking-tighter mb-4">
                FIND YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] to-white">DRIVE.</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-lg mb-8">
                Experience the future of car buying. Instant inventory matching powered by Tekion AI.
              </p>
              <button 
                onClick={() => document.querySelector('.chatbot-trigger')?.click()}
                className="w-fit px-8 py-4 bg-white text-black font-bold text-sm rounded-full hover:bg-[#00D9FF] transition-all flex items-center gap-2"
              >
                Start AI Search <MessageSquare size={18} />
              </button>

              <button 
                onClick={() => setCurrentView('login')}
                 className="absolute top-10 right-10 text-gray-400 hover:text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full border border-gray-800"
              >
                Back to Login
              </button>
            </div>

            {/* The Chatbot Component */}
            <CustomerChatbot />
          </div>
        )}

        {currentView === 'feedback' && (
            <FeedbackForm 
                customer={selectedCustomer} 
                onComplete={() => setCurrentView('crm')} 
                onCancel={() => setCurrentView('crm')} 
            />
        )}

      </div>
    </ErrorBoundary>
  )
}

export default App
