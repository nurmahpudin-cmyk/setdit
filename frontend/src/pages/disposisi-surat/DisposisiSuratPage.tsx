import React, { useState, useEffect } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, Modal, Form, DatePicker,
  Card, Typography, message, Popconfirm, Row, Col, Statistic
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  UserSwitchOutlined, TeamOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  disposisiSuratApi, STATUS_TL_LABELS, STATUS_TL_COLORS, getUnitDisplay, DropdownOptions, DisposisiAccess
} from '../../api/disposisiSurat';
import type { DisposisiSurat, DisposisiSuratStats } from '../../api/disposisiSurat';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const DisposisiSuratPage: React.FC = () => {
  const [data, setData] = useState<DisposisiSurat[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [statusTLFilter, setStatusTLFilter] = useState<string | undefined>();
  const [unitFilter, setUnitFilter] = useState<string | undefined>();
  const [picFilter, setPicFilter] = useState<string | undefined>();
  const [jenisSuratFilter, setJenisSuratFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DisposisiSurat | null>(null);

  const [form] = Form.useForm();
  const [accessForm] = Form.useForm();
  const [options, setOptions] = useState<DropdownOptions | null>(null);
  const [stats, setStats] = useState<DisposisiSuratStats | null>(null);
  const [accessList, setAccessList] = useState<DisposisiAccess[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchOptions();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, statusTLFilter, unitFilter, picFilter, jenisSuratFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await disposisiSuratApi.getAll({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText || undefined,
        status_tl: statusTLFilter,
        unit_code: unitFilter,
        pic: picFilter,
        jenis_surat: jenisSuratFilter,
        start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
        end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
      });
      setData(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
      }));
    } catch (error: any) {
      message.error(error.response?.data?.error || error.response?.data?.message || 'Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const response = await disposisiSuratApi.getDropdownOptions();
      setOptions(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch options:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await disposisiSuratApi.getStats();
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchAccessList = async () => {
    try {
      const [accessRes, usersRes] = await Promise.all([
        disposisiSuratApi.getAccessList(),
        disposisiSuratApi.getAllUsers(),
      ]);
      setAccessList(accessRes.data.data);
      setAllUsers(usersRes.data.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Gagal mengambil data akses');
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (item: DisposisiSurat) => {
    setIsEditMode(true);
    setSelectedItem(item);
    form.setFieldsValue({
      ...item,
      tanggal_surat: item.tanggal_surat ? dayjs(item.tanggal_surat) : null,
      tanggal_disposisi: item.tanggal_disposisi ? dayjs(item.tanggal_disposisi) : null,
      tanggal_deadline: item.tanggal_deadline ? dayjs(item.tanggal_deadline) : null,
    });
    setIsModalOpen(true);
  };

  const openDetail = (item: DisposisiSurat) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleCreateOrUpdate = async (values: any) => {
    try {
      const payload = {
        ...values,
        tanggal_surat: values.tanggal_surat.format('YYYY-MM-DD'),
        tanggal_disposisi: values.tanggal_disposisi.format('YYYY-MM-DD'),
        tanggal_deadline: values.tanggal_deadline?.format('YYYY-MM-DD'),
      };

      if (isEditMode && selectedItem) {
        await disposisiSuratApi.update(selectedItem.id, payload);
        message.success('Disposisi Surat berhasil diperbarui');
      } else {
        await disposisiSuratApi.create(payload);
        message.success('Disposisi Surat berhasil dibuat');
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchData();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.error || error.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await disposisiSuratApi.delete(id);
      message.success('Disposisi Surat berhasil dihapus');
      fetchData();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Gagal menghapus');
    }
  };

  const handleUpdateStatusTL = async (id: number, status_tl: string) => {
    try {
      await disposisiSuratApi.updateStatusTL(id, status_tl as any);
      message.success('Status TL berhasil diperbarui');
      fetchData();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Gagal memperbarui status');
    }
  };

  const handleGrantAccess = async (values: any) => {
    try {
      await disposisiSuratApi.grantAccess(values);
      message.success('Akses berhasil diberikan');
      accessForm.resetFields();
      fetchAccessList();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Gagal memberikan akses');
    }
  };

  const handleRevokeAccess = async (id: number) => {
    try {
      await disposisiSuratApi.revokeAccess(id);
      message.success('Akses berhasil dicabut');
      fetchAccessList();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Gagal mencabut akses');
    }
  };

  const columns: ColumnsType<DisposisiSurat> = [
    {
      title: 'No',
      key: 'no',
      width: 60,
      render: (_, __, index) => ((pagination.current - 1) * pagination.pageSize) + index + 1,
    },
    {
      title: 'Nomor Surat',
      dataIndex: 'nomor_surat',
      key: 'nomor_surat',
      render: (text) => text || '-',
    },
    {
      title: 'Tanggal Surat',
      dataIndex: 'tanggal_surat',
      key: 'tanggal_surat',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      width: 110,
    },
    {
      title: 'Perihal',
      dataIndex: 'hal',
      key: 'hal',
      ellipsis: true,
    },
    {
      title: 'Jenis',
      dataIndex: 'jenis_surat',
      key: 'jenis_surat',
      width: 100,
      render: (jenis) => <Tag color={jenis === 'Undangan' ? 'blue' : 'purple'}>{jenis}</Tag>,
    },
    {
      title: 'Disposisi',
      dataIndex: 'disposisi',
      key: 'disposisi',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Unit',
      dataIndex: 'unit_code',
      key: 'unit_code',
      width: 100,
      render: (code) => <Tag color="cyan">{getUnitDisplay(code)}</Tag>,
    },
    {
      title: 'Tanggal Dispo',
      dataIndex: 'tanggal_disposisi',
      key: 'tanggal_disposisi',
      width: 110,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Deadline',
      dataIndex: 'tanggal_deadline',
      key: 'tanggal_deadline',
      width: 110,
      render: (date) => date ? (
        <Text type={dayjs().isAfter(dayjs(date)) ? 'danger' : undefined}>
          {dayjs(date).format('DD/MM/YYYY')}
        </Text>
      ) : '-',
    },
    {
      title: 'PIC',
      dataIndex: 'pic',
      key: 'pic',
      width: 90,
      render: (pic) => <Tag color="gold">{pic}</Tag>,
    },
    {
      title: 'Status TL',
      dataIndex: 'status_tl',
      key: 'status_tl',
      width: 160,
      render: (status, record) => (
        <Select
          value={status}
          onChange={(val) => handleUpdateStatusTL(record.id, val)}
          style={{ width: '100%' }}
          size="small"
        >
          <Select.Option value="PROSES_TINDAK_LANJUT">Proses TL</Select.Option>
          <Select.Option value="TINDAK_LANJUT_SELESAI">TL Selesai</Select.Option>
        </Select>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(record)} size="small" />
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)} size="small" />
          <Popconfirm
            title="Hapus?"
            description="Apakah Anda yakin ingin menghapus?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Batal"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <Title level={4} className="m-0">Disposisi Surat</Title>
        <Space>
          <Button icon={<TeamOutlined />} onClick={() => { fetchAccessList(); setIsAccessModalOpen(true); }}>
            Kelola Akses
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Tambah Disposisi
          </Button>
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Card size="small">
            <Statistic title="Total Disposisi" value={stats?.total || 0} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Proses Tindak Lanjut"
              value={stats?.proses || 0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Tindak Lanjut Selesai"
              value={stats?.selesai || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Space wrap align="end">
          <Input
            placeholder="Cari surat..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              setDateRange(dates);
              setPagination(prev => ({ ...prev, current: 1 }));
              fetchData();
            }}
          />
          <Select
            placeholder="Status TL"
            allowClear
            style={{ width: 180 }}
            value={statusTLFilter}
            onChange={(val) => {
              setStatusTLFilter(val);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
            options={[
              { label: 'Proses Tindak Lanjut', value: 'PROSES_TINDAK_LANJUT' },
              { label: 'Tindak Lanjut Selesai', value: 'TINDAK_LANJUT_SELESAI' },
            ]}
          />
          <Select
            placeholder="Unit"
            allowClear
            style={{ width: 150 }}
            value={unitFilter}
            onChange={(val) => {
              setUnitFilter(val);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
            options={options?.unit_codes}
          />
          <Select
            placeholder="PIC"
            allowClear
            style={{ width: 140 }}
            value={picFilter}
            onChange={(val) => {
              setPicFilter(val);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
            options={options?.pic.map(p => ({ label: p, value: p }))}
          />
          <Select
            placeholder="Jenis Surat"
            allowClear
            style={{ width: 150 }}
            value={jenisSuratFilter}
            onChange={(val) => {
              setJenisSuratFilter(val);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
            options={[
              { label: 'Undangan', value: 'Undangan' },
              { label: 'Surat Dinas', value: 'Surat Dinas' },
            ]}
          />
          <Button type="primary" onClick={handleSearch}>Cari</Button>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} disposisi`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={isEditMode ? 'Edit Disposisi Surat' : 'Tambah Disposisi Surat Baru'}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="nomor_surat" label="Nomor Surat">
                <Input placeholder="Contoh: 123/ABC/2024" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tanggal_surat"
                label="Tanggal Surat"
                rules={[{ required: true, message: 'Tanggal surat wajib diisi' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="hal"
            label="Perihal"
            rules={[{ required: true, message: 'Perihal wajib diisi' }]}
          >
            <Input.TextArea rows={2} placeholder="Perihal/subyek surat" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="jenis_surat"
                label="Jenis Surat"
                rules={[{ required: true, message: 'Jenis surat wajib dipilih' }]}
              >
                <Select placeholder="Pilih jenis surat">
                  {options?.jenis_surat.map(j => (
                    <Select.Option key={j} value={j}>{j}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit_code"
                label="Unit Tujuan"
                rules={[{ required: true, message: 'Unit wajib dipilih' }]}
              >
                <Select placeholder="Pilih unit">
                  {options?.unit_codes.map(u => (
                    <Select.Option key={u.value} value={u.value}>{u.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="disposisi"
                label="Disposisi"
                rules={[{ required: true, message: 'Disposisi wajib dipilih' }]}
              >
                <Select placeholder="Pilih disposisi" showSearch>
                  {options?.disposisi.map(d => (
                    <Select.Option key={d} value={d}>{d}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pic"
                label="PIC"
                rules={[{ required: true, message: 'PIC wajib dipilih' }]}
              >
                <Select placeholder="Pilih PIC">
                  {options?.pic.map(p => (
                    <Select.Option key={p} value={p}>{p}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isi_disposisi" label="Isi Disposisi (Arahan)">
            <Input.TextArea rows={3} placeholder="Arahan/tindakan yang harus dilakukan..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tanggal_disposisi"
                label="Tanggal Dispo"
                rules={[{ required: true, message: 'Tanggal disposisi wajib diisi' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tanggal_deadline" label="Tanggal Deadline">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0" style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="primary" htmlType="submit">
                {isEditMode ? 'Perbarui' : 'Simpan'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Detail Disposisi Surat"
        open={isDetailModalOpen}
        onCancel={() => { setIsDetailModalOpen(false); setSelectedItem(null); }}
        footer={null}
        width={800}
      >
        {selectedItem && (
          <div>
            <Card title="Informasi Surat" size="small" className="mb-4">
              <Row gutter={[16, 8]}>
                <Col span={12}><Text strong>Nomor Surat:</Text> {selectedItem.nomor_surat || '-'}</Col>
                <Col span={12}><Text strong>Jenis:</Text> <Tag color={selectedItem.jenis_surat === 'Undangan' ? 'blue' : 'purple'}>{selectedItem.jenis_surat}</Tag></Col>
                <Col span={12}><Text strong>Tanggal Surat:</Text> {dayjs(selectedItem.tanggal_surat).format('DD/MM/YYYY')}</Col>
                <Col span={12}><Text strong>Tanggal Disposisi:</Text> {dayjs(selectedItem.tanggal_disposisi).format('DD/MM/YYYY')}</Col>
                <Col span={24}><Text strong>Perihal:</Text> {selectedItem.hal}</Col>
              </Row>
            </Card>

            <Card title="Disposisi" size="small" className="mb-4">
              <Row gutter={[16, 8]}>
                <Col span={12}><Text strong>Unit:</Text> <Tag color="cyan">{getUnitDisplay(selectedItem.unit_code)}</Tag></Col>
                <Col span={12}><Text strong>PIC:</Text> <Tag color="gold">{selectedItem.pic}</Tag></Col>
                <Col span={24}><Text strong>Disposisi:</Text> {selectedItem.disposisi}</Col>
                {selectedItem.tanggal_deadline && (
                  <Col span={12}><Text strong>Deadline:</Text> {dayjs(selectedItem.tanggal_deadline).format('DD/MM/YYYY')}</Col>
                )}
                <Col span={12}>
                  <Text strong>Status TL:</Text>{' '}
                  <Tag color={STATUS_TL_COLORS[selectedItem.status_tl]}>
                    {STATUS_TL_LABELS[selectedItem.status_tl]}
                  </Tag>
                </Col>
                {selectedItem.isi_disposisi && (
                  <Col span={24}>
                    <Text strong>Isi Disposisi:</Text>
                    <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                      {selectedItem.isi_disposisi}
                    </div>
                  </Col>
                )}
              </Row>
            </Card>

            <Card size="small">
              <Text type="secondary">
                Dibuat oleh: {selectedItem.creator?.fullname || '-'} |
                {dayjs(selectedItem.created_at).format('DD/MM/YYYY HH:mm')}
              </Text>
            </Card>
          </div>
        )}
      </Modal>

      {/* Access Management Modal */}
      <Modal
        title="Kelola Akses Disposisi Surat"
        open={isAccessModalOpen}
        onCancel={() => { setIsAccessModalOpen(false); accessForm.resetFields(); }}
        footer={null}
        width={900}
      >
        <Card size="small" className="mb-4">
          <Title level={5}>Berikan Akses Baru</Title>
          <Form form={accessForm} layout="inline" onFinish={handleGrantAccess}>
            <Form.Item
              name="user_id"
              label="User"
              rules={[{ required: true, message: 'User wajib dipilih' }]}
            >
              <Select
                placeholder="Pilih user"
                style={{ width: 250 }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {allUsers.map(u => (
                  <Select.Option key={u.id} value={u.id} label={u.fullname}>
                    {u.fullname} - {u.email}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="unit_code"
              label="Unit"
              rules={[{ required: true, message: 'Unit wajib dipilih' }]}
            >
              <Select placeholder="Pilih unit" style={{ width: 150 }}>
                {options?.unit_codes.map(u => (
                  <Select.Option key={u.value} value={u.value}>{u.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="role" label="Role" initialValue="INPUTER">
              <Select style={{ width: 120 }}>
                <Select.Option value="INPUTER">Inputer</Select.Option>
                <Select.Option value="DISPOSITOR">Dispositor</Select.Option>
                <Select.Option value="ADMIN">Admin</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                Berikan Akses
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Title level={5}>Daftar Akses</Title>
        <Table
          dataSource={accessList}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            {
              title: 'User',
              dataIndex: ['user', 'fullname'],
              render: (text, record) => (
                <div>
                  <Text strong>{text}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{record.user?.email}</Text>
                </div>
              ),
            },
            {
              title: 'Unit',
              dataIndex: 'unit_code',
              render: (code) => <Tag color="cyan">{getUnitDisplay(code)}</Tag>,
            },
            {
              title: 'Role',
              dataIndex: 'role',
              render: (role) => {
                const colors: Record<string, string> = {
                  INPUTER: 'blue',
                  DISPOSITOR: 'green',
                  ADMIN: 'red',
                };
                return <Tag color={colors[role] || 'default'}>{role}</Tag>;
              },
            },
            {
              title: 'Aksi',
              render: (_, record) => (
                <Popconfirm
                  title="Cabut akses?"
                  description="Apakah Anda yakin ingin mencabut akses ini?"
                  onConfirm={() => handleRevokeAccess(record.id)}
                  okText="Ya"
                  cancelText="Batal"
                >
                  <Button type="link" danger size="small">Cabut</Button>
                </Popconfirm>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default DisposisiSuratPage;
