import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './select';

describe('Select', () => {
  it('vẫn là ô chọn gốc: nhận ref, nhãn, đổi giá trị bằng bàn phím', async () => {
    const ref = createRef<HTMLSelectElement>();
    const onChange = vi.fn();
    render(
      <label>
        Ai xem được
        <Select ref={ref} defaultValue="PRIVATE" onChange={onChange}>
          <option value="PRIVATE">Riêng tư</option>
          <option value="PUBLIC">Công khai</option>
        </Select>
      </label>,
    );

    const select = screen.getByRole('combobox', { name: 'Ai xem được' });
    expect(ref.current).toBe(select);
    expect(select).toHaveClass('select-styled', 'appearance-none');

    await userEvent.selectOptions(select, 'PUBLIC');
    expect(select).toHaveValue('PUBLIC');
    expect(onChange).toHaveBeenCalled();
  });
});
