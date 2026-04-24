import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Plane, 
  Utensils, 
  Medal,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  AlertCircle,
  FileSpreadsheet,
  FileBadge
} from 'lucide-react';
import { 
  BUDGET_GROUPS, 
  MONTHS, 
  TRIWULAN_PLANS, 
  TRIWULAN_LABELS,
  formatCurrency, 
  formatNumber,
  cn 
} from './lib/utils';
import { BudgetEntry, MonthlyData } from './types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode; className?: string; key?: string }) => (
  <div className={cn("frosted-glass rounded-[32px] p-8", className)}>
    {children}
  </div>
);

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300",
      active 
        ? "bg-white/20 text-white shadow-xl shadow-indigo-500/10 border border-white/20 scale-105" 
        : "text-slate-400 hover:text-white hover:bg-white/5"
    )}
  >
    <Icon size={18} />
    <span className="hidden md:inline">{label}</span>
  </button>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedYear, setSelectedYear] = useState(2026);
  
  const [data, setData] = useState<Record<string, MonthlyData>>(() => {
    const saved = localStorage.getItem(`blud_data_${selectedYear}`);
    return saved ? JSON.parse(saved) : {
      rekap: {},
      perjalanan: {},
      makanminum: {},
      honorarium: {}
    };
  });

  const [lockedPlanned, setLockedPlanned] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`blud_locked_${selectedYear}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [customPlanned, setCustomPlanned] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(`blud_planned_${selectedYear}`);
    if (saved) return JSON.parse(saved);
    const defaults: Record<string, number> = {};
    BUDGET_GROUPS.forEach(g => g.items.forEach(i => defaults[i.id] = i.planned));
    return defaults;
  });

  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem(`blud_data_${selectedYear}`);
    if (savedData) {
      setData(JSON.parse(savedData));
    } else {
      setData({
        rekap: {},
        perjalanan: {},
        makanminum: {},
        honorarium: {}
      });
    }

    const savedPlanned = localStorage.getItem(`blud_planned_${selectedYear}`);
    if (savedPlanned) {
      setCustomPlanned(JSON.parse(savedPlanned));
    } else {
      const defaults: Record<string, number> = {};
      BUDGET_GROUPS.forEach(g => g.items.forEach(i => defaults[i.id] = i.planned));
      setCustomPlanned(defaults);
    }

    const savedLocked = localStorage.getItem(`blud_locked_${selectedYear}`);
    setLockedPlanned(savedLocked ? JSON.parse(savedLocked) : {});
  }, [selectedYear]);

  useEffect(() => {
    localStorage.setItem(`blud_data_${selectedYear}`, JSON.stringify(data));
  }, [data, selectedYear]);

  useEffect(() => {
    localStorage.setItem(`blud_planned_${selectedYear}`, JSON.stringify(customPlanned));
    localStorage.setItem(`blud_locked_${selectedYear}`, JSON.stringify(lockedPlanned));
  }, [customPlanned, lockedPlanned, selectedYear]);

  const monthRealization = useMemo(() => {
    const totals = new Array(12).fill(0);
    Object.values(data).forEach(categoryData => {
      Object.entries(categoryData).forEach(([monthIdx, entries]) => {
        const monthTotal = entries.reduce((sum, entry) => sum + (Number(entry.nilai) || 0), 0);
        totals[parseInt(monthIdx)] += monthTotal;
      });
    });
    return totals;
  }, [data]);

  const itemizedRealization = useMemo(() => {
    const itemMap: Record<string, number[]> = {};
    
    // Initialize map
    BUDGET_GROUPS.forEach(group => {
      group.items.forEach(item => {
        itemMap[item.key] = new Array(12).fill(0);
      });
    });

    Object.values(data).forEach(categoryData => {
      Object.entries(categoryData).forEach(([monthIdx, entries]) => {
        entries.forEach(entry => {
          if (itemMap[entry.keterangan]) {
            itemMap[entry.keterangan][parseInt(monthIdx)] += (Number(entry.nilai) || 0);
          }
        });
      });
    });

    return itemMap;
  }, [data]);

  const currentTotalPagu = useMemo(() => {
    return Object.values(customPlanned).reduce((a: number, b: number) => a + b, 0);
  }, [customPlanned]);

  const totalUsage = monthRealization.reduce((a, b) => a + b, 0);
  const remainingBudget = currentTotalPagu - totalUsage;
  const progressPercent = (totalUsage / (currentTotalPagu || 1)) * 100;

  const triwulanUsage = useMemo(() => {
    return [
      monthRealization.slice(0, 3).reduce((a, b) => a + b, 0),
      monthRealization.slice(3, 6).reduce((a, b) => a + b, 0),
      monthRealization.slice(6, 9).reduce((a, b) => a + b, 0),
      monthRealization.slice(9, 12).reduce((a, b) => a + b, 0),
    ];
  }, [monthRealization]);

  const updateEntries = (category: string, monthIdx: number, entries: BudgetEntry[]) => {
    setData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [monthIdx]: entries
      }
    }));
  };
  const exportToCSV = () => {
    let csv = 'Uraian,Rencana (Rp),' + MONTHS.join(',') + ',Total Realisasi,Sisa\n';
    BUDGET_GROUPS.forEach(group => {
      group.items.forEach(item => {
        const months = itemizedRealization[item.key] || new Array(12).fill(0);
        const total = months.reduce((a, b) => a + b, 0);
        const plannedValue = customPlanned[item.id] ?? item.planned;
        const sisa = plannedValue - total;
        csv += `"${item.desc}",${plannedValue},${months.join(',')},${total},${sisa}\n`;
      });
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Monitoring_BLUD_2026_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen relative overflow-hidden text-slate-200 p-3 md:p-8 font-sans">
      {/* Decorative Mesh Background */}
      <div className="mesh-blob-1" />
      <div className="mesh-blob-2" />
      <div className="mesh-blob-3" />

      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 frosted-glass p-6 md:p-8 rounded-[32px]">
          <div>
            <h1 className="text-2xl md:text-3xl font-light text-slate-400 tracking-tight flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-indigo-500 to-purple-400 rounded-2xl flex items-center justify-center text-white shrink-0">
                <LayoutDashboard size={20} className="md:w-6 md:h-6" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <span className="text-white font-medium">BLUD <span className="font-light">{selectedYear}</span></span>
                <span className="text-sm md:text-lg text-slate-500 font-light hidden sm:inline">Monitoring Dashboard</span>
              </div>
            </h1>
            <p className="text-slate-500 text-sm md:text-base font-medium mt-3 border-l-2 border-indigo-500 pl-4 py-1">
              Pendidikan dan Pelatihan Pegawai • RSUD dr. H. Jusuf SK
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="appearance-none bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-full hover:bg-white/10 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 pr-10"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                  <option key={year} value={year} className="bg-[#0f172a] text-white">{year} Period</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                <Plus size={14} className="rotate-45" />
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white/5 px-6 py-3 rounded-full border border-white/10 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_indigo]" />
              Sync Active
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-2 p-1.5 frosted-glass rounded-3xl sticky top-4 z-50 overflow-x-auto no-scrollbar shadow-xl">
          <TabButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={LayoutDashboard} 
            label="Monitoring" 
          />
          <TabButton 
            active={activeTab === 'rekap'} 
            onClick={() => setActiveTab('rekap')} 
            icon={FileSpreadsheet} 
            label="Kontribusi" 
          />
          <TabButton 
            active={activeTab === 'perjalanan'} 
            onClick={() => setActiveTab('perjalanan')} 
            icon={Plane} 
            label="Perjadin" 
          />
          <TabButton 
            active={activeTab === 'makanminum'} 
            onClick={() => setActiveTab('makanminum')} 
            icon={Utensils} 
            label="Makan Minum" 
          />
          <TabButton 
            active={activeTab === 'honorarium'} 
            onClick={() => setActiveTab('honorarium')} 
            icon={Medal} 
            label="Honorarium" 
          />
        </nav>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-800 text-white overflow-hidden relative group border-none p-6 md:p-8">
                  <div className="relative z-10">
                    <p className="text-indigo-200 font-semibold mb-2 uppercase tracking-widest text-[10px]">Total Anggaran Dikelola</p>
                    <h2 className="text-4xl md:text-6xl font-light tracking-tighter mb-8">{formatCurrency(currentTotalPagu)}</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 border-t border-white/10 pt-8">
                      <div>
                        <p className="text-indigo-200/60 text-[10px] uppercase font-bold tracking-widest mb-1">Realisasi</p>
                        <p className="text-2xl md:text-3xl font-medium">{formatCurrency(totalUsage)}</p>
                      </div>
                      <div>
                        <p className="text-indigo-200/60 text-[10px] uppercase font-bold tracking-widest mb-1">Sisa</p>
                        <p className="text-2xl md:text-3xl font-medium">{formatCurrency(remainingBudget)}</p>
                      </div>
                    </div>

                    <div className="mt-8 md:mt-10 space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-white bg-white/10 px-4 py-1.5 rounded-full uppercase tracking-widest">
                          {progressPercent.toFixed(1)}% Realization Pulse
                        </span>
                      </div>
                      <div className="h-1.5 md:h-2 w-full bg-black/20 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-white shadow-[0_0_15px_white]" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                </Card>

                <Card className="flex flex-col items-center justify-center relative overflow-hidden p-6 md:p-8 min-h-[350px] lg:min-h-0">
                  <div className="absolute top-0 right-0 p-6">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_indigo]" />
                  </div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Proporsi Realisasi</h3>
                  <div className="w-full h-56 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Terpakai', value: totalUsage },
                            { name: 'Sisa', value: remainingBudget }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={95}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="#6366f1" />
                          <Cell fill="rgba(255,255,255,0.05)" />
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff' }}
                          formatter={(val: number) => formatCurrency(val)} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-6 mt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Realized</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Available</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Triwulan Performance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {TRIWULAN_LABELS.map((label, idx) => {
                  const usage = triwulanUsage[idx];
                  const plan = TRIWULAN_PLANS[idx];
                  const overLimit = usage > plan;
                  
                  return (
                    <Card key={label} className={cn("p-6 border-white/5", overLimit ? "bg-rose-500/5" : "bg-white/5")}>
                      <div className="flex justify-between items-start mb-4">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{label}</p>
                        {overLimit && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rose]" />}
                      </div>
                      <div className="space-y-1">
                        <p className={cn("text-2xl font-light tracking-tight", overLimit ? "text-rose-400" : "text-white")}>
                          {formatNumber(usage)}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Target: {formatNumber(plan)}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-xl font-medium flex items-center gap-4">
                    <span className="w-1 h-8 bg-indigo-500 rounded-full shadow-[0_0_10px_indigo]" />
                    Rincian Belanja <span className="hidden sm:inline">per Item</span>
                  </h3>
                  <div className="flex gap-2 sm:gap-4">
                    <button 
                      onClick={exportToCSV}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all text-indigo-400"
                    >
                      <Download size={14} /> Export
                    </button>
                    <button 
                      onClick={() => setShowReport(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 text-white"
                    >
                      <FileBadge size={14} /> Report
                    </button>
                  </div>
                </div>

                <Card className="p-0 overflow-hidden rounded-[32px] border border-white/10">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-white/5">
                          <th className="p-6 text-[10px] font-black text-indigo-300 uppercase tracking-widest border-b border-white/5 w-1/4">Uraian</th>
                          <th className="p-6 text-[10px] font-black text-indigo-300 uppercase tracking-widest border-b border-white/5 whitespace-nowrap">Rencana</th>
                          {MONTHS.map(m => (
                            <th key={m} className="p-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest border-b border-white/5 text-center">{m.slice(0, 3)}</th>
                          ))}
                          <th className="p-6 text-[10px] font-black text-indigo-300 uppercase tracking-widest border-b border-white/5 text-right">Real.</th>
                          <th className="p-6 text-[10px] font-black text-indigo-300 uppercase tracking-widest border-b border-white/5 text-right">Sisa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {BUDGET_GROUPS.map(group => (
                          <React.Fragment key={group.id}>
                            <tr className="bg-white/[0.02]">
                              <td colSpan={16} className="p-6 text-xs font-semibold text-slate-100 italic opacity-80">{group.name}</td>
                            </tr>
                            {group.items.map(item => {
                              const months = itemizedRealization[item.key] || new Array(12).fill(0);
                              const total = months.reduce((a, b) => a + b, 0);
                              const plannedValue = customPlanned[item.id] ?? item.planned;
                              const isLocked = lockedPlanned[item.id] ?? false;
                              const sisa = plannedValue - total;
                              
                              return (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                  <td className="p-6 text-xs font-light text-slate-300 break-words max-w-[200px]">{item.desc}</td>
                                  <td className="p-6 text-xs font-medium text-slate-500 whitespace-nowrap">
                                    <div className="flex items-center gap-2 group/input">
                                      <div className="relative">
                                        <input
                                          type="text"
                                          disabled={isLocked}
                                          value={formatNumber(plannedValue)}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                                            setCustomPlanned(prev => ({ ...prev, [item.id]: val }));
                                          }}
                                          className={cn(
                                            "bg-transparent border-none focus:ring-0 p-0 text-xs font-bold w-24 transition-all",
                                            isLocked ? "text-slate-500 opacity-60 cursor-not-allowed" : "text-indigo-400 focus:text-indigo-300 border-b border-indigo-500/30 border-dashed"
                                          )}
                                        />
                                      </div>
                                      <button 
                                        onClick={() => setLockedPlanned(prev => ({ ...prev, [item.id]: !isLocked }))}
                                        className={cn(
                                          "p-1.5 rounded-lg transition-all",
                                          isLocked 
                                            ? "text-indigo-400 bg-indigo-500/10" 
                                            : "text-slate-600 hover:text-indigo-400 opacity-0 group-hover/input:opacity-100"
                                        )}
                                      >
                                        {isLocked ? <FileBadge size={14} className="fill-indigo-500/20" /> : <Plus size={14} className="rotate-45" />}
                                      </button>
                                    </div>
                                  </td>
                                  {months.map((val, i) => (
                                    <td key={i} className={cn("px-2 py-6 text-[10px] text-center font-mono", val > 0 ? "text-indigo-400 font-bold" : "text-slate-700")}>
                                      {val > 0 ? formatNumber(val) : '—'}
                                    </td>
                                  ))}
                                  <td className="p-6 text-xs font-medium text-right text-white whitespace-nowrap">{formatNumber(total)}</td>
                                  <td className={cn("p-6 text-xs font-bold text-right whitespace-nowrap", sisa < 0 ? "text-rose-400" : "text-emerald-400")}>
                                    {formatNumber(sisa)}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-white/5 p-4 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest lg:hidden">
                    <AlertCircle size={12} className="text-indigo-400" />
                    Swipe horizontally to view full data
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && showReport && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowReport(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="frosted-glass p-10 max-w-2xl w-full relative z-10 space-y-8 rounded-[40px]"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-6">
                  <h3 className="text-3xl font-light text-white">Summary <span className="font-bold">Report</span></h3>
                  <button onClick={() => setShowReport(false)} className="text-slate-400 hover:text-white transition-colors">
                    <Trash2 size={24} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between p-5 md:p-6 bg-white/5 rounded-3xl border border-white/5">
                    <span className="text-slate-400 uppercase tracking-widest text-[10px] font-bold">Total Pagu</span>
                    <span className="font-medium text-white text-sm md:text-base">{formatCurrency(currentTotalPagu)}</span>
                  </div>
                  <div className="flex justify-between p-5 md:p-6 bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
                    <span className="text-indigo-300 uppercase tracking-widest text-[10px] font-bold">Total Realisasi</span>
                    <span className="font-bold text-indigo-400 text-sm md:text-base text-right">{formatCurrency(totalUsage)} <span className="block sm:inline text-xs opacity-60">({progressPercent.toFixed(2)}%)</span></span>
                  </div>
                  <div className="flex justify-between p-5 md:p-6 bg-rose-500/5 rounded-3xl border border-rose-500/20">
                    <span className="text-rose-300 uppercase tracking-widest text-[10px] font-bold">Sisa Anggaran</span>
                    <span className="font-bold text-rose-400 text-sm md:text-base">{formatCurrency(remainingBudget)}</span>
                  </div>

                  <div className="pt-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-[0.2em] text-center">Quarterly Performance</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {TRIWULAN_LABELS.map((label, idx) => (
                        <div key={label} className="p-4 md:p-5 bg-white/[0.02] border border-white/5 rounded-[24px] flex justify-between items-center text-sm">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                          <span className="text-base font-light text-white">{formatNumber(triwulanUsage[idx])}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => window.print()}
                    className="flex-1 py-4 bg-white text-slate-900 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors shadow-2xl shadow-white/10"
                  >
                    Print Report
                  </button>
                  <button 
                    onClick={() => setShowReport(false)}
                    className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-colors border border-white/10"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab !== 'dashboard' && (
            <DataEntryView 
              key={activeTab}
              category={activeTab}
              data={data[activeTab]}
              onUpdate={updateEntries}
            />
          )}
        </AnimatePresence>

        <footer className="text-center text-slate-400 text-xs font-medium pb-8 border-t border-slate-100 pt-8 mt-12">
          &copy; 2026 BLUD Monitoring System • RSUD dr. H. Jusuf SK • Terintegrasi React & Real-time Persistence
        </footer>
      </div>
    </div>
  );
}

// --- Data Entry Component ---

function DataEntryView({ category, data, onUpdate }: { 
  category: string; 
  data: MonthlyData; 
  onUpdate: (cat: string, m: number, entries: BudgetEntry[]) => void;
  key?: string;
}) {
  const [activeMonth, setActiveMonth] = useState(0);

  const entries = data[activeMonth] || [
    { id: '1', no: '1', tanggal: '', uraian: '', nilai: 0, belanja: '', keterangan: '' },
    { id: '2', no: '2', tanggal: '', uraian: '', nilai: 0, belanja: '', keterangan: '' },
    { id: '3', no: '3', tanggal: '', uraian: '', nilai: 0, belanja: '', keterangan: '' }
  ];

  const options = useMemo(() => {
    switch(category) {
      case 'rekap': return ['Kontribusi Untuk Akreditasi/Prognas', 'Kontribusi Untuk Dokter Spesialis', 'Lain-lain'];
      case 'perjalanan': return [
        'Perjadin Narasumber Dalam Daerah', 
        'Perjadin Narasumber Luar Daerah', 
        'Perjalanan Dinas Untuk Akreditasi/Prognas', 
        'Perjalanan Dinas Untuk Dokter Spesialis, Fellow dan Konsultan'
      ];
      case 'makanminum': return ['Nasi Kotak Biasa', 'Snack Ringan Kotak'];
      case 'honorarium': return ['Honorarium Narasumber', 'Honorarium Pembawa Acara'];
      default: return [];
    }
  }, [category]);

  const addRow = () => {
    const newEntry = { 
      id: Math.random().toString(36).substr(2, 9), 
      no: (entries.length + 1).toString(), 
      tanggal: '', 
      uraian: '', 
      nilai: 0, 
      belanja: category.toUpperCase(), 
      keterangan: '' 
    };
    onUpdate(category, activeMonth, [...entries, newEntry]);
  };

  const removeRow = (id: string) => {
    onUpdate(category, activeMonth, entries.filter(e => e.id !== id));
  };

  const updateRow = (id: string, field: keyof BudgetEntry, value: any) => {
    const updated = entries.map(e => e.id === id ? { ...e, [field]: value } : e);
    onUpdate(category, activeMonth, updated);
  };

  const totalMonth = entries.reduce((sum, e) => sum + (Number(e.nilai) || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 md:space-y-8"
    >
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <h2 className="text-2xl md:text-3xl font-light text-white tracking-tight">
          Input <span className="font-bold uppercase tracking-widest text-indigo-400">{category}</span> Data
        </h2>
        <div className="flex bg-white/5 p-1 rounded-2xl overflow-x-auto no-scrollbar border border-white/5 backdrop-blur-md">
          {MONTHS.map((m, idx) => (
            <button
              key={m}
              onClick={() => setActiveMonth(idx)}
              className={cn(
                "px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeMonth === idx ? "bg-white text-[#0f172a] shadow-xl" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {m.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <Card className="relative overflow-hidden p-6 md:p-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-[16px] md:rounded-[20px] flex items-center justify-center font-black text-lg md:text-xl shadow-2xl shadow-indigo-500/20 shrink-0">
              {activeMonth + 1}
            </div>
            <div>
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-1">{MONTHS[activeMonth]}</p>
              <p className="text-2xl md:text-3xl font-light text-white">{formatCurrency(totalMonth)}</p>
            </div>
          </div>
          <button 
            onClick={addRow}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 md:px-8 py-3.5 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all shadow-xl md:shadow-2xl shadow-indigo-600/30"
          >
            <Plus size={16} /> New Entry
          </button>
        </div>

        <div className="overflow-x-auto rounded-[32px] border border-white/10 bg-black/10 no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-white/5">
                <th className="p-4 md:p-6 text-[10px] font-black text-indigo-300 uppercase tracking-widest w-16 md:w-20">No</th>
                <th className="p-4 md:p-6 text-[10px] font-black text-indigo-300 uppercase tracking-widest w-32 md:w-40">Tanggal</th>
                <th className="p-4 md:p-6 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Uraian Transaksi</th>
                <th className="p-4 md:p-6 text-[10px] font-black text-indigo-300 uppercase tracking-widest w-48 md:w-56">Nilai (Rp)</th>
                <th className="p-4 md:p-6 text-[10px] font-black text-indigo-300 uppercase tracking-widest w-64 md:w-72">Pos Anggaran</th>
                <th className="p-4 md:p-6 text-[10px] font-black text-indigo-300 uppercase tracking-widest w-16 md:w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entries.map((entry, idx) => (
                <tr key={entry.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="p-3 md:p-4">
                    <input 
                      className="w-full bg-transparent border-none focus:ring-0 text-sm font-mono text-slate-500 text-center" 
                      value={entry.no} 
                      onChange={e => updateRow(entry.id, 'no', e.target.value)}
                    />
                  </td>
                  <td className="p-3 md:p-4">
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm text-white focus:bg-white/10 focus:border-indigo-500 focus:ring-0 transition-all" 
                      placeholder="DD/MM"
                      value={entry.tanggal}
                      onChange={e => updateRow(entry.id, 'tanggal', e.target.value)}
                    />
                  </td>
                  <td className="p-3 md:p-4">
                    <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm text-white focus:bg-white/10 focus:border-indigo-500 focus:ring-0 transition-all resize-none h-11 md:h-12"
                      placeholder="Deskripsi..."
                      value={entry.uraian}
                      onChange={e => updateRow(entry.id, 'uraian', e.target.value)}
                    />
                  </td>
                  <td className="p-3 md:p-4">
                    <div className="relative">
                      <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-[10px] font-black font-mono">Rp</span>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 text-sm font-bold text-white focus:bg-white/10 focus:border-indigo-500 focus:ring-0 transition-all text-right"
                        type="text"
                        value={entry.nilai === 0 ? '' : formatNumber(entry.nilai)}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          updateRow(entry.id, 'nilai', val === '' ? 0 : parseInt(val));
                        }}
                      />
                    </div>
                  </td>
                  <td className="p-3 md:p-4">
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm text-white focus:bg-white/10 focus:border-indigo-500 focus:ring-0 transition-all appearance-none"
                      value={entry.keterangan}
                      onChange={e => updateRow(entry.id, 'keterangan', e.target.value)}
                    >
                      <option value="" className="bg-[#0f172a]">Pilih Pos...</option>
                      {options.map(opt => (
                        <option key={opt} value={opt} className="bg-[#0f172a]">{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 md:p-4 text-center">
                    <button 
                      onClick={() => removeRow(entry.id)}
                      className="p-2 md:p-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white/5 p-4 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest sm:hidden rounded-b-[32px]">
          <AlertCircle size={12} className="text-indigo-400" />
          Swipe table to view all columns
        </div>
        
        {entries.length === 0 && (
          <div className="text-center py-16 md:py-24 border-2 border-dashed border-white/5 rounded-[32px] md:rounded-[40px] mt-8 bg-white/[0.01]">
            <FileText size={48} className="mx-auto text-white/5 mb-6 md:w-16 md:h-16" />
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">No records for this month</p>
            <button 
              onClick={addRow}
              className="mt-6 text-indigo-400 font-black text-xs uppercase tracking-widest hover:text-indigo-300 transition-colors"
            >
              Initialize Monthly Sheet
            </button>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-white/[0.02] border-dashed border-white/10 p-10">
          <h4 className="text-[10px] font-black uppercase text-indigo-400 mb-8 tracking-[0.3em]">Operational Protocol</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              "Real-time Persistence: Data is saved instantly to local cache.",
              "Security: Ensure Keterangan Anggaran is correctly assigned for valid reporting.",
              "Efficiency: Use the 'New Entry' button to expand operational logs.",
              "Numerical Integrity: Only digits are processed in numerical fields."
            ].map((text, i) => (
              <div key={i} className="flex gap-5 text-xs text-slate-400 font-medium leading-relaxed">
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-indigo-300 shrink-0 border border-white/10">{i+1}</div>
                {text}
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-800 text-white relative overflow-hidden border-none p-10">
          <div className="text-center relative z-10">
            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-3">{MONTHS[activeMonth]}</p>
            <p className="text-4xl font-light">{formatCurrency(totalMonth)}</p>
            <div className="mt-8 inline-flex items-center gap-3 px-5 py-2 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
              <RotateCcw size={14} className="animate-spin-slow" /> Active Sync
            </div>
          </div>
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </Card>
      </div>
    </motion.div>
  );
}
