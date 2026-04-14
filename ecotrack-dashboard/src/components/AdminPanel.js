import React, { useState } from 'react';
import { Save, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';

const AdminPanel = ({ token, kpis, refreshData }) => {
  const [editValues, setEditValues] = useState({});
  const [loadingIds, setLoadingIds] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  // Handle typing in the input field
  const handleInputChange = (id, value) => {
    setEditValues(prev => ({ ...prev, [id]: value }));
  };

  // Submit the update to the backend
  const handleUpdate = async (id, metricName) => {
    const newValue = editValues[id];
    
    if (newValue === undefined || newValue === "") return;

    setLoadingIds(prev => ({ ...prev, [id]: true }));

    try {
      const res = await fetch('http://localhost:5000/api/update-kpi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, newValue })
      });

      if (!res.ok) throw new Error("Failed to update");

      // Show success toast
      setSuccessMsg(`Successfully updated ${metricName}!`);
      setTimeout(() => setSuccessMsg(""), 3000);

      // Clear the input and tell App.js to re-fetch the live data
      setEditValues(prev => ({ ...prev, [id]: "" }));
      await refreshData();

    } catch (err) {
      alert("Error updating KPI. Are you sure you are an admin?");
    } finally {
      setLoadingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-purple-100 p-3 rounded-xl">
          <ShieldAlert className="text-purple-600" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Control Panel</h2>
          <p className="text-slate-500 text-sm">Update live dashboard metrics directly.</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 flex items-center gap-2 bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={20} />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-100 text-sm font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-5">Metric Name</div>
          <div className="col-span-3">Current Value</div>
          <div className="col-span-4">Update Value</div>
        </div>

        <div className="divide-y divide-slate-100">
          {kpis.map((kpi) => (
            <div key={kpi.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50/50 transition-colors">
              
              <div className="col-span-5 flex items-center gap-3 font-medium text-slate-800">
                <kpi.Icon size={18} className={kpi.color} />
                {kpi.title}
              </div>
              
              <div className="col-span-3">
                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-mono text-sm">
                  {kpi.value}
                </span>
              </div>
              
              <div className="col-span-4 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New value..."
                  value={editValues[kpi.id] !== undefined ? editValues[kpi.id] : ""}
                  onChange={(e) => handleInputChange(kpi.id, e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => handleUpdate(kpi.id, kpi.title)}
                  disabled={loadingIds[kpi.id] || !editValues[kpi.id]}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex items-center justify-center min-w-[40px]"
                >
                  {loadingIds[kpi.id] ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;