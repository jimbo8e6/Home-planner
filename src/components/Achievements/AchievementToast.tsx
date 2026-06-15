import { useEffect } from 'react';
import { RARITY_CONFIG } from '../../achievements/definitions';
import type { Achievement } from '../../achievements/definitions';

interface Props {
  achievement: Achievement;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: Props) {
  const cfg = RARITY_CONFIG[achievement.rarity];

  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={`absolute bottom-6 left-4 right-4 z-50 rounded-2xl border-2 ${cfg.border} ${cfg.bg} ${cfg.glow ? `shadow-xl ${cfg.glow}` : 'shadow-lg'} cursor-pointer animate-achievement-toast`}
      onClick={onDismiss}
      role="alert"
      aria-live="polite"
    >
      <div className="px-4 py-3.5 flex items-center gap-3">
        <span className="text-4xl leading-none flex-shrink-0">{achievement.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>{cfg.label}</span>
            <span className="text-xs text-gray-400 font-medium">Achievement unlocked!</span>
          </div>
          <p className="font-bold text-gray-900 text-sm">{achievement.name}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{achievement.description}</p>
        </div>
        <span className="text-gray-300 text-sm flex-shrink-0">tap to dismiss</span>
      </div>
    </div>
  );
}
