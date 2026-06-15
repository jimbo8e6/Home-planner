import { useState } from 'react';
import { Plus, X, TrendingUp, TrendingDown, CreditCard, ToggleLeft, ToggleRight } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Subscription, Transaction } from '../../types';
import { format, parseISO } from 'date-fns';

function generateId() { return Math.random().toString(36).slice(2); }

const SUB_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const SUB_CATEGORIES = ['Streaming', 'Music', 'Software', 'News', 'Gaming', 'Fitness', 'Cloud', 'Other'];
const TX_CATEGORIES = ['Housing', 'Groceries', 'Food', 'Transport', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Salary', 'Other'];

const PRESET_SUBS = [
  { name: 'Netflix', amount: 17.99, frequency: 'monthly' as const, category: 'Streaming', color: '#ef4444' },
  { name: 'Spotify', amount: 11.99, frequency: 'monthly' as const, category: 'Music', color: '#10b981' },
  { name: 'Amazon Prime', amount: 9.99, frequency: 'monthly' as const, category: 'Shopping', color: '#f59e0b' },
  { name: 'iCloud', amount: 2.99, frequency: 'monthly' as const, category: 'Cloud', color: '#6366f1' },
  { name: 'Disney+', amount: 13.99, frequency: 'monthly' as const, category: 'Streaming', color: '#3b82f6' },
];

export function FinancePlanner() {
  const [subs, setSubs] = useLocalStorage<Subscription[]>('subscriptions', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'transactions'>('overview');
  const [showSubForm, setShowSubForm] = useState(false);
  const [showTxForm, setShowTxForm] = useState(false);
  const [subForm, setSubForm] = useState({ name: '', amount: '', frequency: 'monthly' as Subscription['frequency'], category: 'Streaming', nextBillingDate: '', color: SUB_COLORS[0] });
  const [txForm, setTxForm] = useState({ description: '', amount: '', type: 'expense' as Transaction['type'], category: 'Food', date: new Date().toISOString().slice(0, 10) });

  const activeSubs = subs.filter(s => s.active);
  const monthlySubCost = activeSubs.reduce((sum, s) => {
    if (s.frequency === 'monthly') return sum + s.amount;
    if (s.frequency === 'yearly') return sum + s.amount / 12;
    if (s.frequency === 'weekly') return sum + s.amount * 4.33;
    return sum;
  }, 0);

  const monthlyIncome = transactions.filter(t => t.type === 'income' && t.date.slice(0, 7) === new Date().toISOString().slice(0, 7)).reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = transactions.filter(t => t.type === 'expense' && t.date.slice(0, 7) === new Date().toISOString().slice(0, 7)).reduce((s, t) => s + t.amount, 0);

  const addSub = () => {
    if (!subForm.name || !subForm.amount) return;
    setSubs(prev => [...prev, { id: generateId(), name: subForm.name, amount: parseFloat(subForm.amount), frequency: subForm.frequency, nextBillingDate: subForm.nextBillingDate || new Date().toISOString().slice(0, 10), category: subForm.category, active: true, color: subForm.color }]);
    setSubForm({ name: '', amount: '', frequency: 'monthly', category: 'Streaming', nextBillingDate: '', color: SUB_COLORS[0] });
    setShowSubForm(false);
  };

  const addTransaction = () => {
    if (!txForm.description || !txForm.amount) return;
    setTransactions(prev => [...prev, { id: generateId(), description: txForm.description, amount: parseFloat(txForm.amount), type: txForm.type, category: txForm.category, date: txForm.date }]);
    setTxForm(f => ({ ...f, description: '', amount: '' }));
    setShowTxForm(false);
  };

  const toggleSub = (id: string) => setSubs(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  const removeSub = (id: string) => setSubs(prev => prev.filter(s => s.id !== id));
  const removeTx = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));

  const addPreset = (p: typeof PRESET_SUBS[0]) => {
    if (subs.some(s => s.name === p.name)) return;
    setSubs(prev => [...prev, { id: generateId(), ...p, nextBillingDate: new Date().toISOString().slice(0, 10), active: true }]);
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {(['overview', 'subscriptions', 'transactions'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Monthly Income</p>
              <p className="text-2xl font-bold text-emerald-600">£{monthlyIncome.toFixed(2)}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600"><TrendingUp size={12} /> This month</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-500">£{(monthlyExpenses + monthlySubCost).toFixed(2)}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400"><TrendingDown size={12} /> incl. subscriptions</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Net This Month</p>
              <p className={`text-2xl font-bold ${monthlyIncome - monthlyExpenses - monthlySubCost >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                £{(monthlyIncome - monthlyExpenses - monthlySubCost).toFixed(2)}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400"><CreditCard size={12} /> Balance</div>
            </div>
          </div>

          {/* Active subs summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Active Subscriptions</h3>
              <span className="text-sm text-gray-500">£{monthlySubCost.toFixed(2)}/mo</span>
            </div>
            {activeSubs.length === 0 ? <p className="text-sm text-gray-400">No active subscriptions</p> : (
              <div className="grid grid-cols-2 gap-2">
                {activeSubs.map(s => (
                  <div key={s.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-sm text-gray-700 flex-1 truncate">{s.name}</span>
                    <span className="text-xs text-gray-500">£{s.amount}/{s.frequency === 'monthly' ? 'mo' : s.frequency === 'yearly' ? 'yr' : 'wk'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent transactions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Recent Transactions</h3>
            {transactions.slice(-5).reverse().map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-500' : 'bg-red-400'}`}>
                  {t.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{t.description}</p>
                  <p className="text-xs text-gray-400">{t.category} · {t.date}</p>
                </div>
                <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.type === 'income' ? '+' : '-'}£{t.amount.toFixed(2)}
                </span>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-sm text-gray-400">No transactions yet</p>}
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">{activeSubs.length} active · <strong>£{monthlySubCost.toFixed(2)}/month</strong> · £{(monthlySubCost * 12).toFixed(2)}/year</p>
            </div>
            <button onClick={() => setShowSubForm(!showSubForm)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 font-medium text-sm">
              <Plus size={16} /> Add
            </button>
          </div>

          {showSubForm && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm space-y-3">
              <div className="flex gap-2">
                <input placeholder="Service name" value={subForm.name} onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                <input placeholder="£ Amount" type="number" step="0.01" value={subForm.amount} onChange={e => setSubForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-28 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div className="flex gap-2">
                <select value={subForm.frequency} onChange={e => setSubForm(f => ({ ...f, frequency: e.target.value as Subscription['frequency'] }))}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none">
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="weekly">Weekly</option>
                </select>
                <select value={subForm.category} onChange={e => setSubForm(f => ({ ...f, category: e.target.value }))}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none">
                  {SUB_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="date" value={subForm.nextBillingDate} onChange={e => setSubForm(f => ({ ...f, nextBillingDate: e.target.value }))}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none" placeholder="Next billing" />
              </div>
              <div className="flex gap-1.5">
                {SUB_COLORS.map(c => (
                  <button key={c} onClick={() => setSubForm(f => ({ ...f, color: c }))}
                    className={`w-6 h-6 rounded-full border-2 ${subForm.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={addSub} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">Save</button>
                <button onClick={() => setShowSubForm(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          )}

          {/* Presets */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Quick add popular services</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_SUBS.map(p => (
                <button key={p.name} onClick={() => addPreset(p)} disabled={subs.some(s => s.name === p.name)}
                  className={`text-xs px-3 py-1.5 border rounded-full transition-all ${subs.some(s => s.name === p.name) ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'}`}>
                  {subs.some(s => s.name === p.name) ? '✓ ' : '+ '}{p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {subs.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No subscriptions tracked yet</p>}
            {subs.map(s => (
              <div key={s.id} className={`bg-white border rounded-2xl p-4 flex items-center gap-3 group ${s.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: s.color }}>
                  {s.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.category} · Next: {s.nextBillingDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">£{s.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 capitalize">{s.frequency}</p>
                </div>
                <button onClick={() => toggleSub(s.id)} className="text-gray-400 hover:text-emerald-600 transition-colors">
                  {s.active ? <ToggleRight size={24} className="text-emerald-500" /> : <ToggleLeft size={24} />}
                </button>
                <button onClick={() => removeSub(s.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Track income & spending</p>
            <button onClick={() => setShowTxForm(!showTxForm)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 font-medium text-sm">
              <Plus size={16} /> Add
            </button>
          </div>

          {showTxForm && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm space-y-3">
              <div className="flex gap-2">
                <input placeholder="Description" value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                <input placeholder="£ Amount" type="number" step="0.01" value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-28 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div className="flex gap-2">
                <select value={txForm.type} onChange={e => setTxForm(f => ({ ...f, type: e.target.value as Transaction['type'] }))}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none">
                  <option value="expense">💸 Expense</option>
                  <option value="income">💰 Income</option>
                </select>
                <select value={txForm.category} onChange={e => setTxForm(f => ({ ...f, category: e.target.value }))}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none">
                  {TX_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="date" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={addTransaction} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">Save</button>
                <button onClick={() => setShowTxForm(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {transactions.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No transactions yet</p>}
            {[...transactions].reverse().map(t => (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 group hover:border-gray-300 transition-all">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {t.type === 'income' ? <TrendingUp size={16} className="text-emerald-600" /> : <TrendingDown size={16} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{t.description}</p>
                  <p className="text-xs text-gray-400">{t.category} · {format(parseISO(t.date), 'MMM d, yyyy')}</p>
                </div>
                <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.type === 'income' ? '+' : '-'}£{t.amount.toFixed(2)}
                </span>
                <button onClick={() => removeTx(t.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
