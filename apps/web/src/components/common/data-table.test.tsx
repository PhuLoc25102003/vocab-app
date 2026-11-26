import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataTableCell, DataTableContainer, DataTableHeader, DataTableRow } from './data-table';

describe('DataTable components', () => {
  it('render DataTableContainer với minWidth mặc định', () => {
    const { container } = render(
      <DataTableContainer>
        <div>Nội dung</div>
      </DataTableContainer>,
    );
    expect(container.firstChild).toHaveClass('overflow-x-auto');
    expect(container.querySelector('.min-w-\\[700px\\]')).toBeInTheDocument();
  });

  it('render DataTableHeader với danh sách cột', () => {
    render(
      <DataTableHeader
        columns={[
          { key: 'col1', label: 'Cột 1' },
          { key: 'col2', label: 'Cột 2', align: 'center' },
          { key: 'col3', label: 'Cột 3', align: 'right' },
        ]}
      />,
    );

    expect(screen.getByText('Cột 1')).toBeInTheDocument();
    expect(screen.getByText('Cột 2')).toHaveClass('text-center');
    expect(screen.getByText('Cột 3')).toHaveClass('text-right');
  });

  it('render DataTableRow và DataTableCell chuẩn cấu trúc grid', () => {
    render(
      <DataTableRow gridTemplateColumns="1fr 2fr">
        <DataTableCell>Dữ liệu 1</DataTableCell>
        <DataTableCell align="right">Dữ liệu 2</DataTableCell>
      </DataTableRow>,
    );

    expect(screen.getByText('Dữ liệu 1')).toBeInTheDocument();
    const cell2 = screen.getByText('Dữ liệu 2');
    expect(cell2).toHaveClass('text-right');
  });
});
