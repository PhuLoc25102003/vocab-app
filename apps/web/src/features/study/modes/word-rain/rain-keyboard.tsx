'use client';

import { Delete } from 'lucide-react';
import { memo, useRef, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as const;
/** Lưới 20 cột, mỗi phím chiếm 2 cột để các hàng thẳng nhau như bàn phím điện thoại. */
const ROW_START = ['col-start-1', 'col-start-2', 'col-start-3'] as const;

interface RainKeyboardProps {
  onKey: (char: string) => void;
  onDelete: () => void;
}

function Key({
  label,
  onPress,
  className,
  children,
}: {
  label: string;
  onPress: () => void;
  className?: string;
  children: ReactNode;
}) {
  // Bấm ở `pointerdown` cho nhanh và giữ focus ở ô gõ; `click` chỉ dành cho trình đọc màn hình, bàn phím.
  const pressedByPointer = useRef(false);
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    pressedByPointer.current = true;
    if ('vibrate' in navigator) navigator.vibrate(8);
    onPress();
  };
  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (pressedByPointer.current) {
      pressedByPointer.current = false;
      return;
    }
    onPress();
  };
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      onPointerDown={onPointerDown}
      onClick={onClick}
      className={cn(
        'col-span-2 flex h-12 min-w-0 items-center justify-center rounded-md border border-game-glow/30 bg-game-sky text-body font-semibold text-game-ink transition-colors duration-fast ease-standard select-none active:border-highlight active:bg-game-glow/25 active:text-highlight',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Bàn phím chữ cái của Mưa từ, tránh bộ gõ tiếng Việt và chiếm ít chỗ hơn bàn phím máy. */
export const RainKeyboard = memo(function RainKeyboard({ onKey, onDelete }: RainKeyboardProps) {
  const { t } = useTranslation('study');
  return (
    <div
      role="group"
      aria-label={t('wordRain.keyboard')}
      className="grid touch-manipulation grid-cols-20 gap-x-1 gap-y-1.5"
    >
      {ROWS.map((row, rowIndex) =>
        [...row].map((char, index) => (
          <Key
            key={char}
            label={char}
            onPress={() => onKey(char)}
            className={index === 0 ? ROW_START[rowIndex] : undefined}
          >
            {char}
          </Key>
        )),
      )}
      <Key label={t('wordRain.deleteKey')} onPress={onDelete} className="col-span-4">
        <Delete aria-hidden className="size-5" />
      </Key>
    </div>
  );
});
