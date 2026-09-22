import React, { useState, useEffect } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, Modal, Form, DatePicker,
  Card, Typography, message, Popconfirm, Row, Col, Statistic, Drawer, Grid, Empty
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  UserSwitchOutlined, TeamOutlined, WhatsAppOutlined, FilterOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  disposisiSuratApi, STATUS_TL_LABELS, STATUS_TL_COLORS, getUnitDisplay, DropdownOptions, DisposisiAccess
} from '../../api/disposisiSurat';
import type { DisposisiSurat, DisposisiSuratStats } from '../../api/disposisiSurat';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

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
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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
      unit_codes: item.unit_code,
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
        const response = await disposisiSuratApi.create(payload);
        const notif = response.data.data?.notification;
        const jadwal = response.data.data?.jadwalPimpinan;

        if (notif?.sent > 0) {
          message.success(`Disposisi Surat berhasil dibuat. Notifikasi WA terkirim ke ${notif.sent} dari ${notif.total} penerima di ${notif.unitResults?.length || 0} unit.`);
        } else {
          message.success('Disposisi Surat berhasil dibuat');
          message.warning(notif?.message || 'Notifikasi WhatsApp tidak terkirim');
        }

        if (jadwal) {
          message.info('Entri Jadwal Pimpinan otomatis dibuat karena jenis surat Undangan. Lengkapi Lokasi & Sebagai di halaman Jadwal Pimpinan.');
        }
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchData();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.error || error.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const handleResendNotification = async (id: number) => {
    try {
      const response = await disposisiSuratApi.resendNotification(id);
      const notif = response.data.data;
      if (notif?.sent > 0) {
        message.success(`${notif.message}`);
      } else {
        message.warning(notif?.message || 'Notifikasi tidak terkirim');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Gagal mengirim notifikasi');
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
      width: 44,
      render: (_, __, index) => ((pagination.current - 1) * pagination.pageSize) + index + 1,
    },
    {
      title: 'Nomor Surat',
      dataIndex: 'nomor_surat',
      key: 'nomor_surat',
      width: 140,
      render: (text) => <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{text || '-'}</div>,
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
      width: 320,
      render: (text) => <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{text}</div>,
    },
    {
      title: 'Jenis',
      dataIndex: 'jenis_surat',
      key: 'jenis_surat',
      width: 90,
      render: (jenis) => <Tag color={jenis === 'Undangan' ? 'blue' : 'purple'}>{jenis}</Tag>,
    },
    {
      title: 'Disposisi',
      dataIndex: 'disposisi',
      key: 'disposisi',
      width: 180,
      render: (text) => <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{text}</div>,
    },
    {
      title: 'Unit',
      dataIndex: 'unit_code',
      key: 'unit_code',
      width: 130,
      render: (codes: string[]) => (
        <Space size={[0, 4]} wrap>
          {(codes || []).map((code) => (
            <Tag color="cyan" key={code}>{getUnitDisplay(code)}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Tanggal Dispo',
      dataIndex: 'tanggal_disposisi',
      key: 'tanggal_disposisi',
      width: 110,
      render: (date) => <span style={{ whiteSpace: 'nowrap' }}>{dayjs(date).format('DD/MM/YYYY')}</span>,
    },
    {
      title: 'Deadline',
      dataIndex: 'tanggal_deadline',
      key: 'tanggal_deadline',
      width: 110,
      render: (date) => date ? (
        <Text type={dayjs().isAfter(dayjs(date)) ? 'danger' : undefined} style={{ whiteSpace: 'nowrap' }}>
          {dayjs(date).format('DD/MM/YYYY')}
        </Text>
      ) : '-',
    },
    {
      title: 'PIC',
      dataIndex: 'pic',
      key: 'pic',
      width: 150,
      render: (pic) => <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{pic}</div>,
    },
    {
      title: 'Status TL',
      dataIndex: 'status_tl',
      key: 'status_tl',
      width: 140,
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
      width: 130,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(record)} size="small" />
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)} size="small" />
          <Popconfirm
            title="Kirim ulang notifikasi?"
            description={`Notifikasi WhatsApp akan dikirim ulang ke sekretaris ${(record.unit_code || []).map(getUnitDisplay).join(', ')}.`}
            onConfirm={() => handleResendNotification(record.id)}
            okText="Kirim"
            cancelText="Batal"
          >
            <Button type="link" icon={<WhatsAppOutlined />} size="small" title="Kirim ulang notifikasi" />
          </Popconfirm>
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
      <div className="mb-4 flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} className="m-0">Disposisi Surat</Title>
        <Space wrap>
          <Button icon={<TeamOutlined />} onClick={() => { fetchAccessList(); setIsAccessModalOpen(true); }}>
            {isMobile ? 'Akses' : 'Kelola Akses'}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {isMobile ? 'Tambah' : 'Tambah Disposisi'}
          </Button>
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic title="Total Disposisi" value={stats?.total || 0} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Proses TL"
              value={stats?.proses || 0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="TL Selesai"
              value={stats?.selesai || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        {isMobile ? (
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="Cari surat..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Button onClick={handleSearch}>Cari</Button>
            <Button icon={<FilterOutlined />} onClick={() => setFilterDrawerOpen(true)}>
              Filter
            </Button>
          </Space.Compact>
        ) : (
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
        )}
      </Card>

      {/* Filter Drawer (mobile) */}
      <Drawer
        title="Filter Disposisi Surat"
        placement="bottom"
        height="auto"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        extra={
          <Button
            type="link"
            onClick={() => {
              setStatusTLFilter(undefined);
              setUnitFilter(undefined);
              setPicFilter(undefined);
              setJenisSuratFilter(undefined);
              setDateRange(null);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
          >
            Reset
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text type="secondary">Rentang Tanggal</Text>
            <RangePicker
              style={{ width: '100%', marginTop: 4 }}
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates);
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
            />
          </div>
          <div>
            <Text type="secondary">Status TL</Text>
            <Select
              placeholder="Semua status"
              allowClear
              style={{ width: '100%', marginTop: 4 }}
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
          </div>
          <div>
            <Text type="secondary">Unit</Text>
            <Select
              placeholder="Semua unit"
              allowClear
              style={{ width: '100%', marginTop: 4 }}
              value={unitFilter}
              onChange={(val) => {
                setUnitFilter(val);
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
              options={options?.unit_codes}
            />
          </div>
          <div>
            <Text type="secondary">PIC</Text>
            <Select
              placeholder="Semua PIC"
              allowClear
              style={{ width: '100%', marginTop: 4 }}
              value={picFilter}
              onChange={(val) => {
                setPicFilter(val);
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
              options={options?.pic.map(p => ({ label: p, value: p }))}
            />
          </div>
          <div>
            <Text type="secondary">Jenis Surat</Text>
            <Select
              placeholder="Semua jenis"
              allowClear
              style={{ width: '100%', marginTop: 4 }}
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
          </div>
          <Button type="primary" block onClick={() => { handleSearch(); setFilterDrawerOpen(false); }}>
            Terapkan Filter
          </Button>
        </Space>
      </Drawer>

      {/* Data: tabel di desktop, kartu di mobile */}
      {isMobile ? (
        <div>
          {loading ? (
            <Card loading />
          ) : data.length === 0 ? (
            <Card><Empty description="Tidak ada data disposisi" /></Card>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {data.map((item) => (
                <Card key={item.id} size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <div>
                      <Text strong>{item.nomor_surat || 'Tanpa Nomor Surat'}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(item.tanggal_surat).format('DD/MM/YYYY')}
                      </Text>
                    </div>
                    <Tag color={item.jenis_surat === 'Undangan' ? 'blue' : 'purple'}>{item.jenis_surat}</Tag>
                  </div>

                  <Text style={{ display: 'block', marginBottom: 8 }}>{item.hal}</Text>

                  <Space size={[4, 4]} wrap style={{ marginBottom: 8 }}>
                    {item.unit_code.map((code) => (
                      <Tag color="cyan" key={code}>{getUnitDisplay(code)}</Tag>
                    ))}
                    <Tag color="gold">{item.pic}</Tag>
                  </Space>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Dispo: {dayjs(item.tanggal_disposisi).format('DD/MM/YYYY')}</Text>
                      {item.tanggal_deadline && (
                        <>
                          {' · '}
                          <Text
                            type={dayjs().isAfter(dayjs(item.tanggal_deadline)) ? 'danger' : 'secondary'}
                            style={{ fontSize: 12 }}
                          >
                            Deadline: {dayjs(item.tanggal_deadline).format('DD/MM/YYYY')}
                          </Text>
                        </>
                      )}
                    </div>
                  </div>

                  <Select
                    value={item.status_tl}
                    onChange={(val) => handleUpdateStatusTL(item.id, val)}
                    style={{ width: '100%', marginBottom: 8 }}
                    size="small"
                  >
                    <Select.Option value="PROSES_TINDAK_LANJUT">Proses TL</Select.Option>
                    <Select.Option value="TINDAK_LANJUT_SELESAI">TL Selesai</Select.Option>
                  </Select>

                  <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(item)}>Detail</Button>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(item)}>Edit</Button>
                    <Popconfirm
                      title="Kirim ulang notifikasi?"
                      description={`Notifikasi WhatsApp akan dikirim ulang ke sekretaris ${(item.unit_code || []).map(getUnitDisplay).join(', ')}.`}
                      onConfirm={() => handleResendNotification(item.id)}
                      okText="Kirim"
                      cancelText="Batal"
                    >
                      <Button size="small" icon={<WhatsAppOutlined />} />
                    </Popconfirm>
                    <Popconfirm
                      title="Hapus?"
                      description="Apakah Anda yakin ingin menghapus?"
                      onConfirm={() => handleDelete(item.id)}
                      okText="Ya"
                      cancelText="Batal"
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                </Card>
              ))}
            </Space>
          )}

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Space direction="vertical" size="small">
              <Text type="secondary">Total {pagination.total} disposisi</Text>
              <Space>
                <Button
                  disabled={pagination.current <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                >
                  Sebelumnya
                </Button>
                <Text>{pagination.current} / {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}</Text>
                <Button
                  disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                >
                  Berikutnya
                </Button>
              </Space>
            </Space>
          </div>
        </div>
      ) : (
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
            scroll={{ x: 1580 }}
          />
        </Card>
      )}

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
            <Col xs={24} md={12}>
              <Form.Item name="nomor_surat" label="Nomor Surat">
                <Input placeholder="Contoh: 123/ABC/2024" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
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

          <Form.Item
            name="jenis_surat"
            label="Jenis Surat"
            rules={[{ required: true, message: 'Jenis surat wajib dipilih' }]}
            extra="Jenis Undangan otomatis membuat entri di Jadwal Pimpinan."
          >
            <Select placeholder="Pilih jenis surat">
              {options?.jenis_surat.map(j => (
                <Select.Option key={j} value={j}>{j}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="unit_codes"
            label="Unit Tujuan"
            rules={[{ required: true, message: 'Unit wajib dipilih minimal 1' }]}
            extra="Bisa pilih lebih dari satu unit. Notifikasi WhatsApp dikirim otomatis ke sekretaris tiap unit yang dipilih."
          >
            <Select mode="multiple" placeholder="Pilih unit (bisa lebih dari satu)" allowClear>
              {options?.unit_codes.map(u => (
                <Select.Option key={u.value} value={u.value}>{u.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>

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

          <Form.Item name="isi_disposisi" label="Isi Disposisi (Arahan)">
            <Input.TextArea rows={3} placeholder="Arahan/tindakan yang harus dilakukan..." />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="tanggal_disposisi"
                label="Tanggal Dispo"
                rules={[{ required: true, message: 'Tanggal disposisi wajib diisi' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  onChange={(date) => {
                    // Isi Tanggal Deadline otomatis (+14 hari kalender) hanya jika
                    // field itu masih kosong, supaya tidak menimpa perubahan manual user.
                    if (date && !form.getFieldValue('tanggal_deadline')) {
                      form.setFieldValue('tanggal_deadline', date.add(14, 'day'));
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="tanggal_deadline"
                label="Tanggal Deadline"
                extra="Otomatis 14 hari kalender dari Tanggal Dispo, bisa diubah manual."
              >
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
                <Col xs={24} md={12}><Text strong>Nomor Surat:</Text> {selectedItem.nomor_surat || '-'}</Col>
                <Col xs={24} md={12}><Text strong>Jenis:</Text> <Tag color={selectedItem.jenis_surat === 'Undangan' ? 'blue' : 'purple'}>{selectedItem.jenis_surat}</Tag></Col>
                <Col xs={24} md={12}><Text strong>Tanggal Surat:</Text> {dayjs(selectedItem.tanggal_surat).format('DD/MM/YYYY')}</Col>
                <Col xs={24} md={12}><Text strong>Tanggal Disposisi:</Text> {dayjs(selectedItem.tanggal_disposisi).format('DD/MM/YYYY')}</Col>
                <Col span={24}><Text strong>Perihal:</Text> {selectedItem.hal}</Col>
              </Row>
            </Card>

            <Card title="Disposisi" size="small" className="mb-4">
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Text strong>Unit:</Text>{' '}
                  <Space size={[0, 4]} wrap>
                    {(selectedItem.unit_code || []).map((code) => (
                      <Tag color="cyan" key={code}>{getUnitDisplay(code)}</Tag>
                    ))}
                  </Space>
                </Col>
                <Col xs={24} md={12}><Text strong>PIC:</Text> <Tag color="gold">{selectedItem.pic}</Tag></Col>
                <Col span={24}><Text strong>Disposisi:</Text> {selectedItem.disposisi}</Col>
                {selectedItem.tanggal_deadline && (
                  <Col xs={24} md={12}><Text strong>Deadline:</Text> {dayjs(selectedItem.tanggal_deadline).format('DD/MM/YYYY')}</Col>
                )}
                <Col xs={24} md={12}>
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
