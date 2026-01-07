import React, { useMemo, useState } from 'react';
import { ClipboardCheck, ArrowLeft, Send } from 'lucide-react';
import { authAPI, dealAPI } from '../services/api';

export default function FeedbackForm({ customer, onComplete, onCancel }) {
  const currentUser = authAPI.getCurrentUser();
  const userType = useMemo(() => {
    const raw = (currentUser?.userType || currentUser?.type || '').toString().toLowerCase();
    if (raw === 'customer') return 'customer';
    return 'sales_executive';
  }, [currentUser]);

  const dealId = customer?.dealData?.id || customer?.id;

  const [form, setForm] = useState({
    rating: 5,
    comment: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dealId) {
      setError('Missing deal id for feedback');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await dealAPI.submitFeedback(dealId, {
        userType,
        rating: Number(form.rating),
        comment: form.comment
      });
      onComplete();
    } catch (e2) {
      console.error('Failed to submit feedback:', e2);
      setError('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
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
            <h2 className="text-3xl font-bold">Feedback</h2>
            <p className="text-gray-400">Deal: {customer?.name} ({customer?.model})</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Rating (1-5)</label>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setForm({ ...form, rating: num })}
                  className={`flex-1 py-3 rounded-xl border transition-all ${
                    form.rating === num 
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
              placeholder="Share your feedback..."
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
            ></textarea>
          </div>

          {error && (
            <div className="text-sm text-red-400">{error}</div>
          )}

          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            <Send size={20} /> {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}