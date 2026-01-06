import React, { useState } from 'react';
import { ClipboardCheck, ArrowLeft, Send } from 'lucide-react';

export default function FeedbackForm({ customer, onComplete, onCancel }) {
  const [surveyData, setSurveyData] = useState({
    experience: '',
    reason: '',
    competitor: '',
    followUp: 'no'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Survey Submitted for:', customer.name, surveyData);
    onComplete(); // Takes user back to CRM
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto bg-gray-900 rounded-2xl border border-gray-800 p-8 shadow-2xl">
        <button onClick={onCancel} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={20} /> Back to CRM
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-cyan-500/20 rounded-lg">
            <ClipboardCheck className="text-cyan-400" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Lost Deal Survey</h2>
            <p className="text-gray-400">Customer: {customer?.name} ({customer?.model})</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Primary Reason for Failure</label>
            <select 
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-cyan-500"
              value={surveyData.reason}
              onChange={(e) => setSurveyData({...surveyData, reason: e.target.value})}
              required
            >
              <option value="">Select a reason...</option>
              <option value="price">Price too high</option>
              <option value="inventory">Lack of inventory</option>
              <option value="customer-lost">Customer lost interest</option>
              <option value="competitor">Bought elsewhere</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Salesperson Experience (1-5)</label>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSurveyData({...surveyData, experience: num})}
                  className={`flex-1 py-3 rounded-xl border transition-all ${
                    surveyData.experience === num 
                    ? 'bg-cyan-600 border-cyan-400 shadow-lg shadow-cyan-500/30' 
                    : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Additional Notes</label>
            <textarea 
              rows="4"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-cyan-500"
              placeholder="Provide more context on why the deal failed..."
              onChange={(e) => setSurveyData({...surveyData, competitor: e.target.value})}
            ></textarea>
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            <Send size={20} /> Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
}