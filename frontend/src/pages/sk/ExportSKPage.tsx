import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Table,
  Button,
  Typography,
  Space,
  Spin,
  DatePicker,
} from 'antd';
import {
  FileExcelOutlined,
  DownloadOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { api } from '../../api/axios';
import { skPerhutananApi, SKPerhutanan } from '../../api/skPerhutanan';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;

const WORKFLOW_STEPS = [
  { num: 1, name: 'Input Admin TU' },
  { num: 2, name: 'Setditjen PS' },
  { num: 3, name: 'Kabag PEHK' },
  { num: 4, name: 'Distribusi Ke Anggota' },
  { num: 5, name: 'Telaah Anggota' },
  { num: 6, name: 'Approve Ketua' },
  { num: 7, name: 'Kabag PEHK' },
  { num: 8, name: 'Kasubbag TU' },
  { num: 9, name: 'TTD Setditjen' },
  { num: 10, name: 'Admin TU Penomoran ND' },
  { num: 11, name: 'Dirjen PS' },
  { num: 12, name: 'Admin TU Penomoran SK' },
  { num: 13, name: 'Distribusi SK' },
  { num: 14, name: 'Finalisasi Anggota' },
  { num: 15, name: 'Approve Finalisasi' },
  { num: 16, name: 'Kabag PEHK TTD Salinan' },
  { num: 17, name: 'Arsip & Scan' },
];

interface MasterProvinsi {
  proid: string;
  provinsi: string;
}

interface MasterKabkota {
  kabid: string;
  kabkota: string;
}

interface MasterSkema {
  id_skema: number;
  nama_skema: string;
}

interface SKExport extends SKPerhutanan {
  drafter?: string;
  finalisasi?: string;
  provinsi_name?: string;
  kabupaten_name?: string;
  skema_name?: string;
  tahap_workflow?: string;
}

export default function ExportSKPage() {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<SKExport[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const [provinsiOptions, setProvinsiOptions] = useState<{ label: string; value: string }[]>([]);
  const [skemaOptions, setSkemaOptions] = useState<{ label: string; value: string }[]>([]);

  // Store full list for name resolution
  const [provinsiList, setProvinsiList] = useState<MasterProvinsi[]>([]);
  const [kabkotaList, setKabkotaList] = useState<MasterKabkota[]>([]);
  const [skemaList, setSkemaList] = useState<MasterSkema[]>([]);

  const [selectedProvinsi, setSelectedProvinsi] = useState<string | null>(null);
  const [selectedSkema, setSelectedSkema] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { label: 'Semua Tahun', value: null as string | null },
    ...Array.from({ length: 10 }, (_, i) => ({ label: String(currentYear - i), value: String(currentYear - i) as string | null })),
  ];

  // Helper functions to resolve names from IDs
  const getProvinsiName = (proid: string) => {
    const prov = provinsiList.find(p => p.proid === proid);
    return prov?.provinsi || proid || '-';
  };

  const getKabkotaName = (kabid: string) => {
    const kab = kabkotaList.find(k => k.kabid === kabid);
    return kab?.kabkota || kabid || '-';
  };

  const getSkemaName = (skemaId: string | number) => {
    const skema = skemaList.find(s => String(s.id_skema) === String(skemaId));
    return skema?.nama_skema || skemaId || '-';
  };

  useEffect(() => {
    fetchProvinsi();
    fetchSkema();
    fetchAllKabkota();
    handleSearch();
  }, []);

  const fetchProvinsi = async () => {
    try {
      const res = await api.get('/provinsi');
      const list = res.data.data || [];
      setProvinsiList(list);
      const options = list.map((p: MasterProvinsi) => ({
        label: p.provinsi,
        value: p.proid,
      }));
      setProvinsiOptions(options);
    } catch (err) {
      console.error('Failed to fetch provinsi:', err);
    }
  };

  const fetchSkema = async () => {
    try {
      const res = await api.get('/skema');
      const list = res.data.data || [];
      setSkemaList(list);
      const options = list.map((s: MasterSkema) => ({
        label: s.nama_skema,
        value: String(s.id_skema),
      }));
      setSkemaOptions(options);
    } catch (err) {
      console.error('Failed to fetch skema:', err);
    }
  };

  const fetchAllKabkota = async () => {
    try {
      const res = await api.get('/kabkota');
      const list = res.data.data || [];
      setKabkotaList(list);
    } catch (err) {
      console.error('Failed to fetch kabkota:', err);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const query: any = {
        limit: 1000,
      };

      // Only filter by date if date range is specified
      if (dateRange[0] && dateRange[1]) {
        query.start_date = dateRange[0]?.format('YYYY-MM-DD');
        query.end_date = dateRange[1]?.format('YYYY-MM-DD');
        query.date_field = 'tanggal_surat';
      }

      if (selectedProvinsi) query.provinsi = selectedProvinsi;
      if (selectedSkema) query.skema = selectedSkema;

      const res = await skPerhutananApi.getAll(query);
      const skData = res.data.data || [];

      // Transform data to add drafter, finalisasi, and resolved names
      const transformedData: SKExport[] = skData.map((sk: SKPerhutanan) => {
        const drafterStage = sk.stages?.find(s => s.step_num === 4);
        const finalisasiStage = sk.stages?.find(s => s.step_num === 14);
        const currentStep = WORKFLOW_STEPS.find(s => s.num === sk.current_step);

        return {
          ...sk,
          drafter: drafterStage?.assignee?.fullname || '-',
          finalisasi: finalisasiStage?.assignee?.fullname || '-',
          provinsi_name: getProvinsiName(sk.provinsi || ''),
          kabupaten_name: getKabkotaName(sk.kabupaten || ''),
          skema_name: getSkemaName(sk.skema || ''),
          tahap_workflow: currentStep?.name || `-`,
        };
      });

      setData(transformedData);
    } catch (err) {
      console.error('Search failed:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedYear(null);
    setSelectedProvinsi(null);
    setSelectedSkema(null);
    setDateRange([null, null]);
  };

  const handleExport = () => {
    setExporting(true);

    try {
      const exportData = data.map((sk, index) => ({
        'No': index + 1,
        'Provinsi': sk.provinsi_name || '-',
        'Kabupaten/Kota': sk.kabupaten_name || '-',
        'Kecamatan': sk.kecamatan || '-',
        'Desa': sk.desa || '-',
        'Skema': sk.skema_name || '-',
        'Kelompok PS': sk.kelompok_ps || '-',
        'Luas (Ha)': sk.luas || '-',
        'Jumlah KK': sk.jml_kk || '-',
        'No Surat ND': sk.nomor_surat || '-',
        'Tanggal Surat ND': sk.tanggal_surat ? dayjs(sk.tanggal_surat).format('DD/MM/YYYY') : '-',
        'No ND': sk.nomor_nd_sk || '-',
        'Tanggal ND': sk.tanggal_nd_sk ? dayjs(sk.tanggal_nd_sk).format('DD/MM/YYYY') : '-',
        'No SK': sk.nomor_sk || '-',
        'Tanggal SK': sk.tanggal_sk ? dayjs(sk.tanggal_sk).format('DD/MM/YYYY') : '-',
        'Drafter': sk.drafter || '-',
        'Finalisasi': sk.finalisasi || '-',
        'Tahap Workflow': sk.tahap_workflow || '-',
        'Status': sk.status || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 25 },  // Provinsi
        { wch: 30 },  // Kabupaten/Kota
        { wch: 25 },  // Kecamatan
        { wch: 25 },  // Desa
        { wch: 30 },  // Skema
        { wch: 25 },  // Kelompok PS
        { wch: 12 },  // Luas
        { wch: 12 },  // Jumlah KK
        { wch: 30 },  // No Surat ND
        { wch: 18 },  // Tanggal Surat ND
        { wch: 30 },  // No ND
        { wch: 18 },  // Tanggal ND
        { wch: 30 },  // No SK
        { wch: 18 },  // Tanggal SK
        { wch: 25 },  // Drafter
        { wch: 25 },  // Finalisasi
        { wch: 25 },  // Tahap Workflow
        { wch: 15 },  // Status
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'SK Perhutanan');

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = selectedYear
        ? `SK_Perhutanan_${selectedYear}.xlsx`
        : `SK_Perhutanan_All_${timestamp}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { title: 'No', key: 'no', width: 50, render: (_: any, __: any, index: number) => index + 1 },
    { title: 'No Surat ND', dataIndex: 'nomor_surat', key: 'nomor_surat', width: 150 },
    { title: 'No SK', dataIndex: 'nomor_sk', key: 'nomor_sk', width: 150 },
    { title: 'Kelompok PS', dataIndex: 'kelompok_ps', key: 'kelompok_ps', ellipsis: true },
    { title: 'Provinsi', key: 'provinsi_name', width: 120, render: (_: any, record: SKExport) => record.provinsi_name || '-' },
    { title: 'Kabupaten', key: 'kabupaten_name', width: 150, render: (_: any, record: SKExport) => record.kabupaten_name || '-' },
    { title: 'Skema', key: 'skema_name', width: 150, render: (_: any, record: SKExport) => record.skema_name || '-' },
    { title: 'Luas (Ha)', dataIndex: 'luas', key: 'luas', width: 80 },
    { title: 'Jumlah KK', dataIndex: 'jml_kk', key: 'jml_kk', width: 80 },
    { title: 'Drafter', key: 'drafter', width: 120, render: (_: any, record: SKExport) => record.drafter || '-' },
    { title: 'Finalisasi', key: 'finalisasi', width: 120, render: (_: any, record: SKExport) => record.finalisasi || '-' },
    { title: 'Tahap Workflow', key: 'tahap_workflow', width: 180, render: (_: any, record: SKExport) => record.tahap_workflow || '-' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, string> = {
          DRAFT: 'Draft',
          IN_PROGRESS: 'Proses',
          WAITING_REVISION: 'Revisi',
          APPROVED: 'Disetujui',
          SIGNED: 'Ditandatangani',
          COMPLETED: 'Selesai',
        };
        return statusMap[status] || status;
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={4} style={{ marginBottom: 24 }}>
        <FileExcelOutlined style={{ marginRight: 8 }} />
        Export Data SK Perhutanan
      </Title>

      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Text strong>Tahun</Text>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: '100%', marginTop: 4 }}
              options={yearOptions}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong>Rentang Tanggal</Text>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
              style={{ width: '100%', marginTop: 4 }}
              format="DD/MM/YYYY"
              placeholder={['Awal', 'Akhir']}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong>Provinsi</Text>
            <Select
              value={selectedProvinsi}
              onChange={(val) => setSelectedProvinsi(val)}
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: '100%', marginTop: 4 }}
              options={provinsiOptions}
              placeholder="Pilih Provinsi"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong>Skema</Text>
            <Select
              value={selectedSkema}
              onChange={setSelectedSkema}
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: '100%', marginTop: 4 }}
              options={skemaOptions}
              placeholder="Pilih Skema"
            />
          </Col>
          <Col xs={24}>
            <Space style={{ marginTop: 16 }}>
              <Button type="primary" onClick={handleSearch} loading={loading}>
                Tampilkan Data
              </Button>
              <Button onClick={handleClear}>
                <ClearOutlined /> Reset
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        title="Data SK Perhutanan"
        extra={
          <Space>
            <Text type="secondary">{data.length} data</Text>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              loading={exporting}
              disabled={data.length === 0}
            >
              Export Excel
            </Button>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20, showSizeChanger: true }}
            scroll={{ x: 1500 }}
          />
        )}
      </Card>
    </div>
  );
}
