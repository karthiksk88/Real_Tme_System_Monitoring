import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { metricsService } from '../services/metricsService';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Monitor, 
  RefreshCw, 
  ShieldAlert, 
  ArrowLeft 
} from 'lucide-react';

const PendingComputers = () => {
  const navigate = useNavigate();
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPending = async () => {
    try {
      const res = await metricsService.getPendingComputers();
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        setPendingList(list);
      }
    } catch (e) {
      console.error('Error fetching pending computers', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await metricsService.approveComputer(id);
      fetchPending();
    } catch (e) {
      console.error('Error approving computer', e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      await metricsService.rejectComputer(id);
      fetchPending();
    } catch (e) {
      console.error('Error rejecting computer', e);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/computers')}
            className="p-2 rounded-lg border border-outline-variant text-secondary hover:bg-surface-container transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <Clock className="w-7 h-7 text-amber-500" />
              <h1 className="font-display text-display text-on-background tracking-tight">Pending Onboarding Approvals</h1>
            </div>
            <p className="font-body-md text-body-md text-secondary mt-1">
              Review and approve agent connection requests before authorizing computer lab access.
            </p>
          </div>
        </div>

        <button
          onClick={fetchPending}
          className="p-2.5 rounded-lg border border-outline-variant text-secondary hover:bg-surface-container hover:text-primary transition-colors flex items-center gap-2 text-xs font-bold shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Pending</span>
        </button>
      </div>

      {/* List Grid */}
      <div className="space-y-4">
        {pendingList.length > 0 ? (
          pendingList.map((comp) => (
            <div key={comp.id} className="card-elevated p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-amber-500">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-headline-md text-headline-md font-bold text-on-surface">{comp.hostname}</span>
                    <span className="font-mono-sm text-mono-sm bg-surface-container px-2 py-0.5 rounded border border-outline-variant font-bold text-secondary">
                      {comp.labName || 'General Lab'}
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-secondary font-mono">
                    Agent ID: {comp.agentId} • IP: {comp.ipAddress || '192.168.1.100'} • MAC: {comp.macAddress || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleReject(comp.id)}
                  disabled={processingId === comp.id}
                  className="flex-1 sm:flex-none px-4 py-2 bg-error-container text-error hover:bg-red-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleApprove(comp.id)}
                  disabled={processingId === comp.id}
                  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{processingId === comp.id ? 'Approving...' : 'Approve Onboarding'}</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="card-elevated p-12 text-center text-secondary">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">No Pending Agent Approvals</h3>
            <p className="font-body-md text-body-md text-secondary mt-1">All monitoring agents on campus are currently approved and online.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingComputers;
