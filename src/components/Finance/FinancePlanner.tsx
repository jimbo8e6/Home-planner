import { useState } from 'react';
import { Plus, X, TrendingUp, TrendingDown, ToggleLeft, ToggleRight, Wallet, Receipt, CreditCard, Building2 } from 'lucide-react';
import { useCloudStorage } from '../../hooks/useCloudStorage';
import { triggerAchievementCheck } from '../../achievements/definitions';
import type { Subscription, Transaction, RegularBill } from '../../types';
import { format, parseISO } from 'date-fns';

function generateId() { return Math.random().toString(36).slice(2); }

function toMonthly(amount: number, frequency: string) {
  if (frequency === 'monthly') return amount;
  if (frequency === 'yearly') return amount / 12;
  if (frequency === 'quarterly') return amount / 3;
  if (frequency === 'weekly') return amount * 4.33;
  return amount;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BILL_COLORS = ['#475569', '#3b82f6', '#f59e0b', '#ef4444', '#f97316', '#0ea5e9', '#8b5cf6', '#6b7280'];
const BILL_CATEGORIES = ['Mortgage/Rent', 'Council Tax', 'Car Finance', 'Insurance', 'Gas & Electric', 'Water', 'Internet & Phone', 'TV Licence', 'Other'];

const SUB_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const SUB_CATEGORIES = ['Streaming', 'Music', 'Software', 'News', 'Gaming', 'Fitness', 'Cloud', 'Other'];

const INCOME_CATEGORIES = [
  { value: 'Wages', label: '💼 Wages / Salary' },
  { value: 'Freelance', label: '🧑‍💻 Freelance / Self-employed' },
  { value: 'Benefits', label: '💰 Benefits' },
  { value: 'Gift', label: '🎁 Gift' },
  { value: 'Birthday', label: '🎂 Birthday money' },
  { value: 'Sale', label: '🛒 Sold something' },
  { value: 'Investment', label: '📈 Investment / Dividend' },
  { value: 'Rental', label: '🏡 Rental income' },
  { value: 'Other', label: '✨ Other' },
];

const EXPENSE_CATEGORIES = ['Groceries', 'Food & Drink', 'Transport', 'Fuel', 'Healthcare', 'Clothing', 'Entertainment', 'Home & Garden', 'Personal Care', 'Education', 'Gifts', 'Other'];


type Tab = 'overview' | 'income' | 'bills' | 'subscriptions' | 'transactions';

// ─── Main Component ───────────────────────────────────────────────────────────

export function FinancePlanner() {
  const [subs, setSubs] = useCloudStorage<Subscription[]>('subscriptions', []);
  const [bills, setBills] = useCloudStorage<RegularBill[]>('regular-bills', []);
  const [transactions, setTransactions] = useCloudStorage<Transaction[]>('transactions', []);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const thisMonth = new Date().toISOString().slice(0, 7);

  const incomeEntries = transactions.filter(t => t.type === 'income');
  const expenseEntries = transactions.filter(t => t.type === 'expense');

  const monthlyIncome = incomeEntries.filter(t => t.date.slice(0, 7) === thisMonth).reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = expenseEntries.filter(t => t.date.slice(0, 7) === thisMonth).reduce((s, t) => s + t.amount, 0);

  const monthlyBillsCost = bills.filter(b => b.active).reduce((sum, b) => sum + toMonthly(b.amount, b.frequency), 0);
  const monthlySubCost = subs.filter(s => s.active).reduce((sum, s) => sum + toMonthly(s.amount, s.frequency), 0);
  const totalMonthlyCommitted = monthlyBillsCost + monthlySubCost;
  const net = monthlyIncome - totalMonthlyCommitted - monthlyExpenses;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'income', label: 'Income' },
    { id: 'bills', label: 'Bills' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'transactions', label: 'Expenses' },
  ];

  return (
    <div>
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab
        monthlyIncome={monthlyIncome} monthlyExpenses={monthlyExpenses}
        monthlyBillsCost={monthlyBillsCost} monthlySubCost={monthlySubCost}
        totalMonthlyCommitted={totalMonthlyCommitted} net={net}
        bills={bills} transactions={transactions}
        onTabChange={setActiveTab}
      />}
      {activeTab === 'income' && <IncomeTab transactions={transactions} setTransactions={setTransactions} />}
      {activeTab === 'bills' && <BillsTab bills={bills} setBills={setBills} monthlyBillsCost={monthlyBillsCost} />}
      {activeTab === 'subscriptions' && <SubscriptionsTab subs={subs} setSubs={setSubs} monthlySubCost={monthlySubCost} />}
      {activeTab === 'transactions' && <ExpensesTab transactions={expenseEntries} setTransactions={setTransactions} />}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ monthlyIncome, monthlyExpenses, monthlyBillsCost, monthlySubCost, totalMonthlyCommitted, net, bills, transactions, onTabChange }: {
  monthlyIncome: number; monthlyExpenses: number; monthlyBillsCost: number; monthlySubCost: number;
  totalMonthlyCommitted: number; net: number; bills: RegularBill[];
  transactions: Transaction[]; onTabChange: (t: Tab) => void;
}) {
  const totalOut = totalMonthlyCommitted + monthlyExpenses;

  return (
    <div className="space-y-5">
      {/* Headline cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Income this month</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">£{monthlyIncome.toFixed(2)}</p>
          <button onClick={() => onTabChange('income')} className="text-xs text-emerald-500 dark:text-emerald-400 hover:text-emerald-700 mt-1">Add income →</button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Building2 size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Fixed costs / mo</p>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">£{totalMonthlyCommitted.toFixed(2)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Bills £{monthlyBillsCost.toFixed(0)} · Subs £{monthlySubCost.toFixed(0)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Receipt size={16} className="text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Variable spend</p>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">£{monthlyExpenses.toFixed(2)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${net >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <Wallet size={16} className={net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Net this month</p>
          </div>
          <p className={`text-2xl font-bold ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {net >= 0 ? '+' : ''}£{net.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{net >= 0 ? 'In the green' : 'Over budget'}</p>
        </div>
      </div>

      {/* Spending bar */}
      {totalOut > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Monthly outgoings breakdown</h3>
          <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-3">
            {monthlyBillsCost > 0 && <div className="bg-blue-500 transition-all" style={{ width: `${(monthlyBillsCost / totalOut) * 100}%` }} title={`Bills £${monthlyBillsCost.toFixed(0)}`} />}
            {monthlySubCost > 0 && <div className="bg-violet-400 transition-all" style={{ width: `${(monthlySubCost / totalOut) * 100}%` }} title={`Subs £${monthlySubCost.toFixed(0)}`} />}
            {monthlyExpenses > 0 && <div className="bg-orange-400 transition-all" style={{ width: `${(monthlyExpenses / totalOut) * 100}%` }} title={`Expenses £${monthlyExpenses.toFixed(0)}`} />}
          </div>
          <div className="flex gap-6 text-sm text-gray-700 dark:text-gray-300">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />Bills <strong>£{monthlyBillsCost.toFixed(0)}</strong></span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-violet-400 flex-shrink-0" />Subscriptions <strong>£{monthlySubCost.toFixed(0)}</strong></span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-400 flex-shrink-0" />Expenses <strong>£{monthlyExpenses.toFixed(0)}</strong></span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Recent income */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Recent Income</h3>
            <button onClick={() => onTabChange('income')} className="text-xs text-emerald-500 hover:text-emerald-700">Add →</button>
          </div>
          {transactions.filter(t => t.type === 'income').length === 0
            ? <p className="text-sm text-gray-400 dark:text-gray-500">No income recorded yet. <button onClick={() => onTabChange('income')} className="text-emerald-500 hover:underline">Add some</button></p>
            : [...transactions].filter(t => t.type === 'income').reverse().slice(0, 4).map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <span className="text-lg">{INCOME_CATEGORIES.find(c => c.value === t.category)?.label.split(' ')[0] || '💰'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{t.description}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t.category} · {format(parseISO(t.date), 'MMM d')}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">+£{t.amount.toFixed(2)}</span>
              </div>
            ))
          }
        </div>

        {/* Active bills */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Active Bills</h3>
            <button onClick={() => onTabChange('bills')} className="text-xs text-blue-500 hover:text-blue-700">Manage →</button>
          </div>
          {bills.filter(b => b.active).length === 0
            ? <p className="text-sm text-gray-400 dark:text-gray-500">No bills tracked. <button onClick={() => onTabChange('bills')} className="text-blue-500 hover:underline">Add bills</button></p>
            : bills.filter(b => b.active).slice(0, 4).map(b => (
              <div key={b.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{b.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{b.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">£{b.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">/{b.frequency === 'monthly' ? 'mo' : b.frequency === 'yearly' ? 'yr' : b.frequency === 'quarterly' ? 'qtr' : 'wk'}</p>
                </div>
              </div>
            ))
          }
          {bills.filter(b => b.active).length > 4 && (
            <button onClick={() => onTabChange('bills')} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mt-2">+{bills.filter(b => b.active).length - 4} more bills</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Income Tab ───────────────────────────────────────────────────────────────

function IncomeTab({ transactions, setTransactions }: { transactions: Transaction[]; setTransactions: (v: Transaction[] | ((p: Transaction[]) => Transaction[])) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Wages', date: new Date().toISOString().slice(0, 10) });
  const [filterCat, setFilterCat] = useState('all');

  const incomeEntries = transactions.filter(t => t.type === 'income');
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthTotal = incomeEntries.filter(t => t.date.slice(0, 7) === thisMonth).reduce((s, t) => s + t.amount, 0);

  const addIncome = () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    const label = INCOME_CATEGORIES.find(c => c.value === form.category)?.label.replace(/^[^\s]+\s/, '') || form.category;
    setTransactions(prev => [...prev, {
      id: generateId(),
      description: form.description || label,
      amount: parseFloat(form.amount),
      type: 'income',
      category: form.category,
      date: form.date,
    }]);
    setForm(f => ({ ...f, description: '', amount: '' }));
    setShowForm(false);
    triggerAchievementCheck();
  };

  const remove = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));

  const filtered = (filterCat === 'all' ? incomeEntries : incomeEntries.filter(t => t.category === filterCat))
    .slice().reverse();

  return (
    <div className="w-full">
      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-5 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">This month's income</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">£{thisMonthTotal.toFixed(2)}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-700 font-medium text-sm">
          <Plus size={16} /> Add Income
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-5 shadow-sm space-y-3">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100">Record income</h4>
          {/* Category tiles */}
          <div className="grid grid-cols-3 gap-2">
            {INCOME_CATEGORIES.map(cat => (
              <button key={cat.value} onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                className={`text-left px-3 py-2.5 rounded-xl text-sm border transition-all ${form.category === cat.value ? 'border-gray-900 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-gray-300 flex-1">
              <span className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium">£</span>
              <input autoFocus type="number" step="0.01" placeholder="0.00" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addIncome()}
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent dark:text-white dark:placeholder-gray-500" />
            </div>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-white" />
          </div>
          <input placeholder="Description (optional — defaults to category)" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
          <div className="flex gap-2">
            <button onClick={addIncome}
              disabled={!form.amount || parseFloat(form.amount) <= 0}
              className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${!form.amount || parseFloat(form.amount) <= 0 ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-700'}`}>
              Save Income {form.amount ? `(£${parseFloat(form.amount || '0').toFixed(2)})` : ''}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', ...INCOME_CATEGORIES.map(c => c.value).filter(v => incomeEntries.some(t => t.category === v))].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${filterCat === cat ? 'bg-gray-900 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Income list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp size={40} className="mx-auto text-gray-200 dark:text-gray-600 mb-3" />
          <p className="text-gray-400 dark:text-gray-500">No income recorded yet. Hit "Add Income" to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <div key={t.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3 group hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
              <span className="text-xl flex-shrink-0">{INCOME_CATEGORIES.find(c => c.value === t.category)?.label.split(' ')[0] || '💰'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t.category} · {format(parseISO(t.date), 'EEE, d MMM yyyy')}</p>
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">+£{t.amount.toFixed(2)}</span>
              <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all">
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Bills Tab ────────────────────────────────────────────────────────────────

function BillsTab({ bills, setBills, monthlyBillsCost }: {
  bills: RegularBill[]; setBills: (v: RegularBill[] | ((p: RegularBill[]) => RegularBill[])) => void; monthlyBillsCost: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', frequency: 'monthly' as RegularBill['frequency'], category: 'Mortgage/Rent', nextDueDate: '', color: BILL_COLORS[0] });

  const addBill = () => {
    if (!form.name || !form.amount) return;
    setBills(prev => [...prev, { id: generateId(), name: form.name, amount: parseFloat(form.amount), frequency: form.frequency, nextDueDate: form.nextDueDate || new Date().toISOString().slice(0, 10), category: form.category, active: true, color: form.color }]);
    setForm({ name: '', amount: '', frequency: 'monthly', category: 'Mortgage/Rent', nextDueDate: '', color: BILL_COLORS[0] });
    setShowForm(false);
    triggerAchievementCheck();
  };

const toggle = (id: string) => setBills(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  const remove = (id: string) => setBills(prev => prev.filter(b => b.id !== id));

  const activeBills = bills.filter(b => b.active);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeBills.length} active · <strong className="text-gray-800 dark:text-gray-100">£{monthlyBillsCost.toFixed(2)}/month</strong> · £{(monthlyBillsCost * 12).toFixed(2)}/year
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700 font-medium text-sm">
          <Plus size={16} /> Add Bill
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-4 shadow-sm space-y-3">
          <div className="flex gap-2">
            <input autoFocus placeholder="Bill name (e.g. Mortgage, Council Tax)" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden w-32 focus-within:ring-2 focus-within:ring-gray-300">
              <span className="px-2 py-2.5 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm">£</span>
              <input type="number" step="0.01" placeholder="0.00" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="flex-1 px-2 py-2.5 text-sm focus:outline-none bg-transparent dark:text-white dark:placeholder-gray-500" />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as RegularBill['frequency'] }))}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 focus:outline-none dark:bg-gray-700 dark:text-white">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
            </select>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 focus:outline-none dark:bg-gray-700 dark:text-white">
              {BILL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="date" value={form.nextDueDate} onChange={e => setForm(f => ({ ...f, nextDueDate: e.target.value }))}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 focus:outline-none dark:bg-gray-700 dark:text-white" title="Next due date" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Colour:</span>
            <div className="flex gap-1.5">
              {BILL_COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addBill} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {/* Bill list */}
      {bills.length === 0 && <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">No bills tracked yet. Use the quick-add buttons above or click "Add Bill".</p>}
      <div className="space-y-2">
        {bills.map(b => {
          const monthly = toMonthly(b.amount, b.frequency);
          return (
            <div key={b.id} className={`bg-white dark:bg-gray-800 border rounded-2xl p-4 flex items-center gap-3 group transition-all ${b.active ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800 opacity-55'}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: b.color + '20', border: `1.5px solid ${b.color}40` }}>
                <CreditCard size={16} style={{ color: b.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-100">{b.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{b.category}{b.nextDueDate ? ` · Due ${b.nextDueDate}` : ''}</p>
              </div>
              <div className="text-right mr-2">
                <p className="font-semibold text-gray-800 dark:text-gray-100">£{b.amount.toFixed(2)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{b.frequency}</p>
                {b.frequency !== 'monthly' && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">≈ £{monthly.toFixed(2)}/mo</p>
                )}
              </div>
              <button onClick={() => toggle(b.id)} className="text-gray-400 hover:text-blue-600 transition-colors" title={b.active ? 'Deactivate' : 'Activate'}>
                {b.active ? <ToggleRight size={24} className="text-blue-500" /> : <ToggleLeft size={24} />}
              </button>
              <button onClick={() => remove(b.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Subscriptions Tab ────────────────────────────────────────────────────────

function SubscriptionsTab({ subs, setSubs, monthlySubCost }: {
  subs: Subscription[]; setSubs: (v: Subscription[] | ((p: Subscription[]) => Subscription[])) => void; monthlySubCost: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', frequency: 'monthly' as Subscription['frequency'], category: 'Streaming', nextBillingDate: '', color: SUB_COLORS[0] });

  const addSub = () => {
    if (!form.name || !form.amount) return;
    setSubs(prev => [...prev, { id: generateId(), name: form.name, amount: parseFloat(form.amount), frequency: form.frequency, nextBillingDate: form.nextBillingDate || new Date().toISOString().slice(0, 10), category: form.category, active: true, color: form.color }]);
    setForm({ name: '', amount: '', frequency: 'monthly', category: 'Streaming', nextBillingDate: '', color: SUB_COLORS[0] });
    setShowForm(false);
    triggerAchievementCheck();
  };

const toggle = (id: string) => setSubs(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  const remove = (id: string) => setSubs(prev => prev.filter(s => s.id !== id));
  const activeSubs = subs.filter(s => s.active);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{activeSubs.length} active · <strong className="text-gray-800 dark:text-gray-100">£{monthlySubCost.toFixed(2)}/month</strong> · £{(monthlySubCost * 12).toFixed(2)}/year</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700 font-medium text-sm">
          <Plus size={16} /> Add
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-4 shadow-sm space-y-3">
          <div className="flex gap-2">
            <input autoFocus placeholder="Service name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden w-32 focus-within:ring-2 focus-within:ring-gray-300">
              <span className="px-2 py-2.5 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm">£</span>
              <input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="flex-1 px-2 py-2.5 text-sm focus:outline-none bg-transparent dark:text-white dark:placeholder-gray-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as Subscription['frequency'] }))}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 focus:outline-none dark:bg-gray-700 dark:text-white">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
            </select>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 focus:outline-none dark:bg-gray-700 dark:text-white">
              {SUB_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="date" value={form.nextBillingDate} onChange={e => setForm(f => ({ ...f, nextBillingDate: e.target.value }))}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 focus:outline-none dark:bg-gray-700 dark:text-white" />
          </div>
          <div className="flex gap-1.5">
            {SUB_COLORS.map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                className={`w-6 h-6 rounded-full border-2 ${form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addSub} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {subs.length === 0 && <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">No subscriptions tracked yet</p>}
        {subs.map(s => (
          <div key={s.id} className={`bg-white dark:bg-gray-800 border rounded-2xl p-4 flex items-center gap-3 group ${s.active ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800 opacity-55'}`}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: s.color }}>
              {s.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 dark:text-gray-100">{s.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{s.category} · Next: {s.nextBillingDate}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-800 dark:text-gray-100">£{s.amount.toFixed(2)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{s.frequency}</p>
            </div>
            <button onClick={() => toggle(s.id)} className="text-gray-400 hover:text-violet-600 transition-colors">
              {s.active ? <ToggleRight size={24} className="text-violet-500" /> : <ToggleLeft size={24} />}
            </button>
            <button onClick={() => remove(s.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────

function ExpensesTab({ transactions, setTransactions }: {
  transactions: Transaction[]; setTransactions: (v: Transaction[] | ((p: Transaction[]) => Transaction[])) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Groceries', date: new Date().toISOString().slice(0, 10) });

  const addExpense = () => {
    if (!form.description || !form.amount) return;
    setTransactions(prev => [...prev, { id: generateId(), description: form.description, amount: parseFloat(form.amount), type: 'expense', category: form.category, date: form.date }]);
    setForm(f => ({ ...f, description: '', amount: '' }));
    setShowForm(false);
  };

  const remove = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));

  const sorted = [...transactions].reverse();
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTotal = transactions.filter(t => t.date.slice(0, 7) === thisMonth).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">This month: <strong className="text-gray-800 dark:text-gray-100">£{monthTotal.toFixed(2)}</strong> in variable expenses</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700 font-medium text-sm">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-4 shadow-sm space-y-3">
          <div className="flex gap-2">
            <input autoFocus placeholder="What did you spend on?" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden w-32 focus-within:ring-2 focus-within:ring-gray-300">
              <span className="px-2 py-2.5 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm">£</span>
              <input type="number" step="0.01" placeholder="0.00" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addExpense()}
                className="flex-1 px-2 py-2.5 text-sm focus:outline-none bg-transparent dark:text-white dark:placeholder-gray-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 focus:outline-none dark:bg-gray-700 dark:text-white">
              {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 focus:outline-none dark:bg-gray-700 dark:text-white" />
          </div>
          <div className="flex gap-2">
            <button onClick={addExpense} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <TrendingDown size={40} className="mx-auto text-gray-200 dark:text-gray-600 mb-3" />
          <p className="text-gray-400 dark:text-gray-500">No expenses recorded. Grocery shops auto-appear here too.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(t => (
            <div key={t.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3 group hover:border-orange-200 dark:hover:border-orange-800 transition-all">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <TrendingDown size={16} className="text-red-500 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t.category} · {format(parseISO(t.date), 'EEE, d MMM yyyy')}</p>
              </div>
              <span className="font-semibold text-red-500 dark:text-red-400">-£{t.amount.toFixed(2)}</span>
              <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all">
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
