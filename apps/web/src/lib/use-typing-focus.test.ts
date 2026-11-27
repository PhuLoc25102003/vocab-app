import { describe, expect, it } from 'vitest';
import { opensDeviceKeyboard } from './use-typing-focus';

function input({
  type,
  readOnly = false,
  inputMode,
}: {
  type: string;
  readOnly?: boolean;
  inputMode?: string;
}) {
  const element = document.createElement('input');
  element.type = type;
  element.readOnly = readOnly;
  if (inputMode) element.setAttribute('inputmode', inputMode);
  return element;
}

describe('opensDeviceKeyboard', () => {
  it('ô chữ và textarea mở bàn phím máy', () => {
    expect(opensDeviceKeyboard(input({ type: 'text' }))).toBe(true);
    expect(opensDeviceKeyboard(input({ type: 'search' }))).toBe(true);
    expect(opensDeviceKeyboard(document.createElement('textarea'))).toBe(true);
  });

  it('radio, nút, ô chỉ đọc và inputMode none thì không', () => {
    expect(opensDeviceKeyboard(input({ type: 'radio' }))).toBe(false);
    expect(opensDeviceKeyboard(input({ type: 'text', readOnly: true }))).toBe(false);
    expect(opensDeviceKeyboard(input({ type: 'text', inputMode: 'none' }))).toBe(false);
    expect(opensDeviceKeyboard(document.createElement('button'))).toBe(false);
    expect(opensDeviceKeyboard(null)).toBe(false);
  });
});
