import React, { useState, useEffect, useCallback } from 'react';
import { 
  Leaf, LayoutDashboard, Droplets, Zap, Trash2, 
  Menu, LogOut, Loader2, Wind, Factory, BatteryMedium, Settings, TrendingUp
} from 'lucide-react';
import AdminPanel from './components/AdminPanel'; 

const App = () => {
  // 🔐 AUTH & ROLE
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 🎛️ UI STATE
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 REAL DATA
  const [kpis, setKpis] = useState([]);
  const [monthlyEmissions, setMonthlyEmissions] = useState([]);

  // 🎨 SMART KPI CONFIGURATION
  const kpiConfig = [
    { icon: Factory, color: 'text-rose-500', bg: 'bg-rose-100', fallbackName: 'Carbon Footprint', threshold: 10000 },
    { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-100', fallbackName: 'Energy Consumption', threshold: 5000 },
    { icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-100', fallbackName: 'Water Usage', threshold: 1000 },
    { icon: Trash2, color: 'text-slate-500', bg: 'bg-slate-100', fallbackName: 'Waste Generated', threshold: 500 },
    { icon: Wind, color: 'text-cyan-500', bg: 'bg-cyan-100', fallbackName: 'Air Quality Index', threshold: 100 },
    { icon: BatteryMedium, color: 'text-purple-500', bg: 'bg-purple-100', fallbackName: 'Grid Load', threshold: 80 }
  ];

  // 🔐 LOGIN
  const login = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role); 
        setToken(data.token);
        setRole(data.role); 
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      alert("Error connecting to server.");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role"); 
    setToken(null);
    setRole(null);
  };

  // 📡 FETCH DATA 
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [res1, res2] = await Promise.all([
        fetch("http://localhost:5000/api/live-kpis", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/emissions", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (res1.status === 401 || res2.status === 401) {
        logout();
        return;
      }

      const kpiData = await res1.json();
      const emissionData = await res2.json();

      setKpis(kpiData.map((k, index) => {
        const config = kpiConfig[index % kpiConfig.length];
        const numericValue = Number(k.metric_value);
        
        return {
          id: k.id,
          title: k.metric_name || config.fallbackName,
          value: k.metric_value,
          isHighImpact: !isNaN(numericValue) && numericValue > config.threshold,
          Icon: config.icon,
          color: config.color,
          bg: config.bg
        };
      }));

      setMonthlyEmissions(emissionData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchDashboardData();
  }, [token, fetchDashboardData]);

  const maxEmission = Math.max(...monthlyEmissions.map(d => d.value || 0), 1);

  // 📝 CLEANED UP SIDEBAR MENU
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
  ];

  if (role === 'admin') {
    navItems.push({ id: 'admin-panel', label: 'Admin Settings', icon: Settings });
  }

  // 🔐 LOGIN SCREEN
  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <form onSubmit={login} className="bg-white p-8 rounded-2xl shadow-xl space-y-6 w-80">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="bg-emerald-100 p-3 rounded-full mb-2">
              <Leaf className="text-emerald-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">EcoTrack</h2>
            <p className="text-sm text-slate-500">Sign in to your dashboard</p>
          </div>
          <div className="space-y-4">
            <input placeholder="Email address" type="email" required className="border border-slate-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" onChange={(e) => setEmail(e.target.value)} />
            <input placeholder="Password" type="password" required className="border border-slate-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={isLoading} className="bg-emerald-500 hover:bg-emerald-600 transition-colors text-white font-semibold w-full py-3 rounded-lg flex justify-center items-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* 🚀 SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-auto flex flex-col`}>
        <div className="flex items-center justify-center h-20 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 text-emerald-400">
            <Leaf size={28} />
            <span className="text-2xl font-bold text-white tracking-wide">EcoTrack</span>
          </div>
        </div>
        
        <nav className="p-4 space-y-2 mt-4 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === item.id 
                  ? item.id === 'admin-panel' 
                    ? 'bg-purple-500/20 text-purple-400 shadow-sm'
                    : 'bg-emerald-500/15 text-emerald-400 shadow-sm' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* 🖥️ MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-600 hover:text-slate-900" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu size={26} />
            </button>
            <h1 className="hidden md:block text-xl font-bold text-slate-800 capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {role === 'admin' && <span className="hidden sm:inline bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Admin Mode</span>}
            <button onClick={logout} className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all px-4 py-2 rounded-lg font-semibold border border-red-100 hover:border-red-500 shadow-sm">
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          
          {activeTab === 'admin-panel' ? (
            <AdminPanel token={token} kpis={kpis} refreshData={fetchDashboardData} />
          ) : (
            <>
              {/* DEFAULT DASHBOARD VIEW */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Sustainability Overview</h2>
                {isLoading && <Loader2 className="animate-spin text-emerald-500" size={24} />}
              </div>

              {/* KPI GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {kpis.length > 0 ? kpis.map((kpi) => (
                  <div key={kpi.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between group h-full">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <h3 className="text-slate-500 text-sm font-medium mb-1 group-hover:text-slate-700 transition-colors">{kpi.title}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-slate-800">{kpi.value}</span>
                        </div>
                      </div>
                      
                      {/* 🔥 HIGH IMPACT BADGE */}
                      {kpi.isHighImpact && (
                        <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md w-fit border border-rose-100">
                          <TrendingUp size={14} />
                          High Impact
                        </div>
                      )}
                    </div>
                    
                    <div className={`p-3 rounded-xl ${kpi.bg} shrink-0`}>
                      <kpi.Icon className={kpi.color} size={24} />
                    </div>
                  </div>
                )) : (!isLoading && <div className="col-span-full text-slate-500">No metrics found.</div>)}
              </div>

              {/* CHART SECTION */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mt-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-bold text-slate-800">Carbon Emissions Trend</h3>
                </div>
                <div className="h-72 flex items-end gap-2 sm:gap-4 border-b border-slate-200 pb-2 relative">
                  {monthlyEmissions.length > 0 ? monthlyEmissions.map((data, index) => {
                    const height = (data.value / maxEmission) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center justify-end h-full z-10 group relative cursor-pointer">
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white text-xs font-bold py-1 px-2 rounded">{data.value}</div>
                        <div className="w-full max-w-[60px] bg-emerald-400 hover:bg-emerald-500 rounded-t-sm transition-all" style={{ height: `${height}%`, minHeight: '4px' }} />
                        <span className="text-xs sm:text-sm text-slate-500 mt-3 font-medium">{data.month}</span>
                      </div>
                    );
                  }) : (!isLoading && <div>No data.</div>)}
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
};

export default App;