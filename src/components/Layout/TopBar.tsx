import { ChevronLeft } from 'lucide-react';

interface TopBarProps {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}

export function TopBar({ title, onBack, right }: TopBarProps) {
  return (
    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center gap-3 px-4 py-3.5">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors flex-shrink-0 active:scale-95"
      >
        <ChevronLeft size={20} />
      </button>
      <h1 className="flex-1 text-base font-bold text-gray-900 truncate">{title}</h1>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}
