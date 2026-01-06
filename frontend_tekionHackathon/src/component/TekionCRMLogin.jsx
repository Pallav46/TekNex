import React, { useState } from 'react';
import { Car, User, Briefcase, Mail, Phone, MapPin, Calendar, Shield, ChevronDown } from 'lucide-react';
import { authAPI } from '../services/api';

export default function TekionCRMLogin({ onLogin }) {
  const [userType, setUserType] = useState('customer');
  const [isSignup, setIsSignup] = useState(false);
  const [showExpertiseMenu, setShowExpertiseMenu] = useState(false);
  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    age: '',
    dateOfJoining: ''
  });

  const expertiseOptions = [
    { id: 'hatchback', label: 'Hatchback', icon: '🚗' },
    { id: 'sedan', label: 'Sedan', icon: '🚘' },
    { id: 'suv', label: 'SUV', icon: '🚙' },
    { id: 'luxury', label: 'Luxury', icon: '🏎️' },
    { id: 'electric', label: 'Electric', icon: '⚡' },
    { id: 'sports', label: 'Sports', icon: '🏁' }
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleExpertise = (id) => {
    setSelectedExpertise(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        // Registration
        const userData = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          userType: userType === 'salesperson' ? 'sales_executive' : 'customer',
        };

        // Add sales executive specific fields
        if (userType === 'salesperson') {
          userData.dealerId = 1; // Default to Premium Auto Hub
        }

        const response = await authAPI.register(userData);
        console.log('Registration successful:', response);
        
        // Call parent onLogin callback with user data
        if (onLogin) {
          onLogin(userType, response);
        }
      } else {
        // Login
        const credentials = {
          email: formData.email,
          password: formData.password,
          userType: userType === 'salesperson' ? 'sales_executive' : 'customer',
        };

        const response = await authAPI.login(credentials);
        console.log('Login successful:', response);

        // Determine user type from response (sales_executive or customer)
        const actualUserType = response.userType === 'sales_executive' ? 'salesperson' : 'customer';
        
        // Call parent onLogin callback with user data
        if (onLogin) {
          onLogin(actualUserType, response);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Authentication failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      address: '',
      age: '',
      dateOfJoining: ''
    });
    setSelectedExpertise([]);
    setError('');
  };

  const switchUserType = (type) => {
    setUserType(type);
    setIsSignup(false);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Road lines animation */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute left-1/4 top-0 w-1 h-full bg-white animate-pulse"></div>
        <div className="absolute right-1/4 top-0 w-1 h-full bg-white animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Car className="w-16 h-16 text-blue-400 animate-bounce" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">Tekion CRM</h1>
          <p className="text-gray-400 text-lg">Drive Your Business Forward</p>
        </div>

        {/* User Type Selector */}
        <div className="flex gap-4 mb-8 max-w-md mx-auto">
          <button
            onClick={() => switchUserType('customer')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
              userType === 'customer'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50 scale-105'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            <User className="w-5 h-5" />
            Customer
          </button>
          <button
            onClick={() => switchUserType('salesperson')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
              userType === 'salesperson'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/50 scale-105'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            Salesperson
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
          {/* Form Header */}
          <div className={`p-8 ${userType === 'customer' ? 'bg-gradient-to-r from-blue-600/20 to-blue-700/20' : 'bg-gradient-to-r from-purple-600/20 to-purple-700/20'}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                {userType === 'customer' ? <User className="w-8 h-8" /> : <Briefcase className="w-8 h-8" />}
                {isSignup ? 'Create Account' : 'Welcome Back'}
              </h2>
              <Shield className={`w-8 h-8 ${userType === 'customer' ? 'text-blue-400' : 'text-purple-400'}`} />
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit}>
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="relative">
                <label className="block text-gray-300 mb-2 font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="relative">
                <label className="block text-gray-300 mb-2 font-medium">Password</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Signup Fields for Customer */}
              {isSignup && userType === 'customer' && (
                <>
                  <div className="relative">
                    <label className="block text-gray-300 mb-2 font-medium">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-gray-300 mb-2 font-medium">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="+1 (555) 000-0000"
                        required
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-gray-300 mb-2 font-medium">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="123 Main St, City"
                        required
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-gray-300 mb-2 font-medium">Age</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="25"
                        min="18"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Signup Fields for Salesperson */}
              {isSignup && userType === 'salesperson' && (
                <>
                  <div className="relative">
                    <label className="block text-gray-300 mb-2 font-medium">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Sarah Sales"
                        required
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-gray-300 mb-2 font-medium">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="+1 (555) 000-0000"
                        required
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-gray-300 mb-2 font-medium">Date of Joining</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="date"
                        name="dateOfJoining"
                        value={formData.dateOfJoining}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Expertise Multi-Select */}
                  <div className="relative md:col-span-2">
                    <label className="block text-gray-300 mb-2 font-medium">Vehicle Expertise</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowExpertiseMenu(!showExpertiseMenu)}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 px-4 text-left text-white flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      >
                        <span className="flex flex-wrap gap-2">
                          {selectedExpertise.length === 0 ? (
                            <span className="text-gray-500">Select your expertise...</span>
                          ) : (
                            selectedExpertise.map(id => {
                              const option = expertiseOptions.find(o => o.id === id);
                              return (
                                <span key={id} className="bg-purple-600 px-3 py-1 rounded-lg text-sm flex items-center gap-1">
                                  {option.icon} {option.label}
                                </span>
                              );
                            })
                          )}
                        </span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${showExpertiseMenu ? 'rotate-180' : ''}`} />
                      </button>

                      {showExpertiseMenu && (
                        <div className="absolute z-20 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
                          {expertiseOptions.map(option => (
                            <label
                              key={option.id}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedExpertise.includes(option.id)}
                                onChange={() => toggleExpertise(option.id)}
                                className="w-5 h-5 rounded bg-slate-900 border-slate-600 text-purple-600 focus:ring-2 focus:ring-purple-500"
                              />
                              <span className="text-2xl">{option.icon}</span>
                              <span className="text-white font-medium">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-8 py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 hover:scale-105 shadow-lg ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                userType === 'customer'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/50'
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-500/50'
              }`}
            >
              {loading ? '⏳ Processing...' : (isSignup ? '🚀 Create Account' : '🔑 Sign In')}
            </button>
            </form>

            {/* Toggle Login/Signup */}
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                <span className={`font-semibold ${userType === 'customer' ? 'text-blue-400' : 'text-purple-400'}`}>
                  {isSignup ? 'Sign In' : 'Sign Up'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p>© 2025 Tekion CRM. Accelerating Automotive Excellence.</p>
        </div>
      </div>
    </div>
  );
}
