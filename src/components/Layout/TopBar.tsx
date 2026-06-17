import { ChevronLeft } from 'lucide-react';

interface TopBarProps {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}

export function TopBar({ title, onBack, right }: TopBarProps) {
  return (
    <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-800" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
    <div className="flex items-center gap-3 px-4 py-3.5">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0 active:scale-95"
      >
        <ChevronLeft size={20} />
      </button>
      <h1 className="flex-1 text-base font-bold text-white truncate">{title}</h1>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
    </div>
  );
}
