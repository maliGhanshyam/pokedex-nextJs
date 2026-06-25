'use client';

import { useEffect, useState } from 'react';
import { battleTheme } from '@/components/battle/battleTheme';

export interface GuestLimitDetail {
  action?: string;
  limit?: number;
  message?: string;
}

interface GuestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => void;
  detail?: GuestLimitDetail | null;
}

const ACTION_LABELS: Record<string, string> = {
  battle: 'battles',
  favorite: 'favorites',
  compare: 'comparisons',
  team_analyze: 'team analyses',
};

export default function GuestLimitModal({
  isOpen,
  onClose,
  onSignup,
  detail,
}: GuestLimitModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isOpen);
  }, [isOpen]);

  if (!visible) return null;

  const actionLabel = detail?.action
    ? ACTION_LABELS[detail.action] || detail.action
    : 'actions';
  const limit = detail?.limit ?? 10;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60] p-4"
      style={{ backgroundColor: `${battleTheme.navy}e6` }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8"
        style={{ backgroundColor: battleTheme.buttercream, border: `3px solid ${battleTheme.livingCoral}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <span className="text-4xl">🔒</span>
          <h2 className="text-2xl font-bold mt-2" style={{ color: battleTheme.navy }}>
            Guest limit reached
          </h2>
          <p className="text-sm mt-2" style={{ color: battleTheme.slate }}>
            {detail?.message ||
              `You've used all ${limit} free guest ${actionLabel}. Sign up for unlimited access — your progress starts fresh as a member.`}
          </p>
        </div>

        <div
          className="rounded-xl p-3 mb-5 text-xs"
          style={{ backgroundColor: `${battleTheme.peachFuzz}44`, color: battleTheme.navy }}
        >
          Guest data is cleared when you log out. Create an account to keep favorites, battle history, and more.
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignup();
            }}
            className="w-full py-3 rounded-xl font-bold"
            style={{ backgroundColor: battleTheme.classicBlue, color: battleTheme.buttercream }}
          >
            Sign up to continue
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl text-sm font-medium"
            style={{ color: battleTheme.slate }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

export function dispatchGuestLimitModal(detail?: GuestLimitDetail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('guestLimitExceeded', { detail }));
  }
}
