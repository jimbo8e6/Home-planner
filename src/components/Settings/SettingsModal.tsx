import { useState } from 'react';
import { X, ChevronDown, ChevronUp, Mail, User, Save, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const HELP_SECTIONS = [
  {
    emoji: '📅',
    title: 'Calendar',
    content: 'Tap any day to add an event. Give it a title, optional time, and a colour to organise by type — for example blue for work, green for family. Events falling today show as alerts on your dashboard.',
  },
  {
    emoji: '✅',
    title: 'To-Do List',
    content: 'Add tasks with High, Medium, or Low priority. Set a due date so overdue and urgent tasks surface automatically as dashboard alerts. Tap a task to edit it, or tick the checkbox to mark it complete.',
  },
  {
    emoji: '🛒',
    title: 'Shopping List',
    content: 'Add items by category to keep your list organised as you walk around the shop. Tick items off as you go. When done, tap "Complete Shop" to log the total cost in Finance and automatically move food items into your Kitchen.',
  },
  {
    emoji: '🧊',
    title: 'Kitchen',
    content: 'Track everything in your fridge, freezer, and cupboard. Tap the barcode icon to scan a product and add it instantly. Tap any item to edit its quantity, location, expiry date, or category. Items expiring within 3 days appear as dashboard alerts.',
  },
  {
    emoji: '👨‍🍳',
    title: 'Recipes',
    content: 'Automatically suggests recipes based on what\'s in your Kitchen. Sorted by how many of your ingredients each recipe uses — or switch to "% Complete" to prioritise recipes you\'re closest to making. Tap any recipe for full ingredients and step-by-step instructions.',
  },
  {
    emoji: '💰',
    title: 'Finance',
    content: 'Log income and one-off expenses under Transactions. Add regular bills (rent, utilities) and subscriptions (streaming, gym) so your monthly commitments are always accounted for. The dashboard shows how much you have left this month after all committed spending.',
  },
];

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const saveName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await supabase.auth.updateUser({ data: { name: name.trim() } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      className="absolute inset-0 bg-black/50 z-50 flex flex-col"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 flex-1 overflow-y-auto rounded-t-3xl" style={{ marginTop: 'max(calc(env(safe-area-inset-top) + 0.5rem), 3.5rem)' }}>

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 pt-5 pb-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-gray-500 dark:text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-5 space-y-6 pb-10">

          {/* Profile */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User size={15} className="text-gray-400 dark:text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Profile</h3>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                Your name
              </label>
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveName()}
                  placeholder="e.g. James"
                  className="flex-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-400 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                />
                <button
                  onClick={saveName}
                  disabled={saving || !name.trim()}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 disabled:opacity-40 ${
                    saved
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100'
                  }`}
                >
                  {saved ? '✓ Saved' : <><Save size={14} />Save</>}
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Shows in the greeting on your home screen.
              </p>
            </div>
          </div>

          {/* Help */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">❓</span>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Help & Guide</h3>
            </div>
            <div className="space-y-2">
              {HELP_SECTIONS.map(section => (
                <div key={section.title} className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === section.title ? null : section.title)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg leading-none">{section.emoji}</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{section.title}</span>
                    </div>
                    {expanded === section.title
                      ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                      : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                    }
                  </button>
                  {expanded === section.title && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{section.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Mail size={15} className="text-gray-400 dark:text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contact</h3>
            </div>
            <a
              href="mailto:louthtech@gmail.com?subject=HomePlanner Feedback"
              className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Send feedback or report a bug</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">louthtech@gmail.com</p>
              </div>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
