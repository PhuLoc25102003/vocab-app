'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState, type ComponentProps } from 'react';
import { FormField } from './form-field';
import { useTranslation } from 'react-i18next';

type PasswordFieldProps = Omit<ComponentProps<typeof FormField>, 'type' | 'trailing'>;

export function PasswordField({ className, ...props }: PasswordFieldProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  // Next giữ trang cũ ẩn trong DOM, khi quay lại ô này phải che như ban đầu.
  useEffect(() => () => setVisible(false), []);

  return (
    <FormField
      {...props}
      type={visible ? 'text' : 'password'}
      className={`pr-12 ${className ?? ''}`}
      trailing={
        <button
          type="button"
          aria-label={t(visible ? 'password.hide' : 'password.show')}
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-md text-text-muted transition-colors duration-fast ease-standard hover:text-text"
        >
          <Icon aria-hidden className="size-5" />
        </button>
      }
    />
  );
}
