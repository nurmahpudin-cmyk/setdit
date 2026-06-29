import { useBreakpoint } from 'antd';
import { Dropdown, Button } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useResponsiveColumns(columns: any[], dropdownActions?: (record: any) => any[]) {
  const screens = useBreakpoint();

  const updatedColumns = columns.map((col) => ({
    ...col,
    width: col.key === 'action' ? (screens.xs ? 100 : 160) : col.width,
  }));

  if (dropdownActions) {
    const lastColIndex = updatedColumns.length - 1;
    const originalActionCol = updatedColumns[lastColIndex];

    updatedColumns[lastColIndex] = {
      ...originalActionCol,
      render: (_: unknown, record: unknown) => {
        const items = dropdownActions(record as never);
        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button size="small" icon={<MoreOutlined />}>Aksi</Button>
          </Dropdown>
        );
      },
    };
  }

  return updatedColumns;
}
