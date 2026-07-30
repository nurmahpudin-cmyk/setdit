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
  Input,
  Pagination,
} from 'antd';
import {
  FileExcelOutlined,
  DownloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { api } from '../../api/axios';
import { skPerhutananApi, SKPerhutanan } from '../../api/skPerhutanan';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Text } = Typography;

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
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [provinsiOptions, setProvinsiOptions] = useState<{ label: string; value: string }[]>([]);
  const [skemaOptions, setSkemaOptions] = useState<{ label: string; value: string }[]>([]);

  // Store full list for name resolution
  const [provinsiList, setProvinsiList] = useState<MasterProvinsi[]>([]);
  const [kabkotaList, setKabkotaList] = useState<MasterKabkota[]>([]);
  const [skemaList, setSkemaList] = useState<MasterSkema[]>([]);

  const [selectedProvinsi, setSelectedProvinsi] = useState<string | null>(null);
  const [selectedSkema, setSelectedSkema] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [searchValue, setSearchValue] = useState('');

  // Lookup functions (defined before useEffect)
  const getProvinsiNameFromData = (proid: string | null | undefined, provList: MasterProvinsi[]) => {
    if (!proid) return '-';
    const prov = provList.find(p => String(p.proid) === String(proid));
    return prov?.provinsi || proid || '-';
  };

  const getKabkotaNameFromData = (kabid: string | null | undefined, kabList: MasterKabkota[]) => {
    if (!kabid) return '-';
    const kab = kabList.find(k => String(k.kabid) === String(kabid));
    return kab?.kabkota || kabid || '-';
  };

  const getSkemaNameFromData = (skemaId: string | number | null | undefined, skList: MasterSkema[]) => {
    if (!skemaId) return '-';
    const skema = skList.find(s => Number(s.id_skema) === Number(skemaId));
    return skema?.nama_skema || String(skemaId) || '-';
  };

  // Fetch all master data in parallel, then fetch SK data
  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      try {
        const [provRes, skemaRes, kabRes] = await Promise.all([
          api.get('/provinsi'),
          api.get('/skema'),
          api.get('/kabkota'),
        ]);

        if (!isMounted) return;

        // Set Provinsi - data is in res.data.data based on API structure
        let provList: MasterProvinsi[] = [];
        if (provRes.data?.data && Array.isArray(provRes.data.data)) {
          provList = provRes.data.data;
        } else if (provRes.data?.records && Array.isArray(provRes.data.records)) {
          provList = provRes.data.records;
        }
        setProvinsiList(provList);
        setProvinsiOptions(provList.map((p: MasterProvinsi) => ({
          label: p.provinsi,
          value: p.proid,
        })));

        // Set Skema
        let skemaDataList: MasterSkema[] = [];
        if (skemaRes.data?.data && Array.isArray(skemaRes.data.data)) {
          skemaDataList = skemaRes.data.data;
        } else if (skemaRes.data?.records && Array.isArray(skemaRes.data.records)) {
          skemaDataList = skemaRes.data.records;
        }
        setSkemaList(skemaDataList);
        setSkemaOptions(skemaDataList.map((s: MasterSkema) => ({
          label: s.nama_skema || '-',
          value: String(s.id_skema),
        })));

        // Set Kabkota
        let kabList: MasterKabkota[] = [];
        if (kabRes.data?.data && Array.isArray(kabRes.data.data)) {
          kabList = kabRes.data.data;
        } else if (kabRes.data?.records && Array.isArray(kabRes.data.records)) {
          kabList = kabRes.data.records;
        }
        setKabkotaList(kabList);

        // Now fetch SK with the loaded master data
        handleSearchWithData(1, provList, kabList, skemaDataList);
      } catch (err: any) {
        console.error('Failed to fetch master data:', err);
      }
    };

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, []);

  // Re-search when filters change
  useEffect(() => {
    if (provinsiList.length > 0 && kabkotaList.length > 0 && skemaList.length > 0) {
      handleSearchWithData(1, provinsiList, kabkotaList, skemaList);
    }
  }, [selectedProvinsi, selectedSkema, dateRange, searchValue]);

  // Main search function that accepts master data
  const handleSearchWithData = async (
    page = currentPage,
    provList?: MasterProvinsi[],
    kabList?: MasterKabkota[],
    skList?: MasterSkema[]
  ) => {
    setLoading(true);
    setCurrentPage(page);
    try {
      const query: any = {
        page,
        limit: pageSize,
      };

      if (dateRange[0] && dateRange[1]) {
        query.start_date = dateRange[0]?.format('YYYY-MM-DD');
        query.end_date = dateRange[1]?.format('YYYY-MM-DD');
        query.date_field = 'tanggal_surat';
      }

      if (selectedProvinsi) query.provinsi = selectedProvinsi;
      if (selectedSkema) query.skema = selectedSkema;
      if (searchValue.trim()) query.search = searchValue.trim();

      const res = await skPerhutananApi.getAll(query);
      const skData = res.data?.data || [];
      const pagination = res.data?.pagination || { total: 0 };

      setTotal(pagination.total);

      // Use passed data or state for lookup
      const currentProvList = provList || provinsiList;
      const currentKabList = kabList || kabkotaList;
      const currentSkList = skList || skemaList;

      const transformedData: SKExport[] = skData.map((sk: SKPerhutanan) => {
        const drafterStage = sk.stages?.find(s => s.step_num === 4);
        const finalisasiStage = sk.stages?.find(s => s.step_num === 14);
        const currentStep = WORKFLOW_STEPS.find(s => s.num === sk.current_step);

        return {
          ...sk,
          drafter: drafterStage?.assignee?.fullname || '-',
          finalisasi: finalisasiStage?.assignee?.fullname || '-',
          provinsi_name: getProvinsiNameFromData(sk.provinsi || '', currentProvList),
          kabupaten_name: getKabkotaNameFromData(sk.kabupaten || '', currentKabList),
          skema_name: getSkemaNameFromData(sk.skema || '', currentSkList),
          tahap_workflow: currentStep?.name || `-`,
        };
      });

      setData(transformedData);
    } catch (err) {
      console.error('Search failed:', err);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Wrapper for regular search (uses state)
  const handleSearch = async (page = currentPage) => {
    handleSearchWithData(page);
  };

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
      handleSearch(page);
    } else {
      handleSearch(page);
    }
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      // Fetch all data for export (without pagination)
      const query: any = {
        limit: 10000, // Max 10000 records
      };

      if (dateRange[0] && dateRange[1]) {
        query.start_date = dateRange[0]?.format('YYYY-MM-DD');
        query.end_date = dateRange[1]?.format('YYYY-MM-DD');
        query.date_field = 'tanggal_surat';
      }

      if (selectedProvinsi) query.provinsi = selectedProvinsi;
      if (selectedSkema) query.skema = selectedSkema;
      if (searchValue.trim()) query.search = searchValue.trim();

      const res = await skPerhutananApi.getAll(query);
      const skData = res.data.data || [];

      // Transform data
      const exportData = skData.map((sk: SKPerhutanan) => {
        const drafterStage = sk.stages?.find(s => s.step_num === 4);
        const finalisasiStage = sk.stages?.find(s => s.step_num === 14);
        const currentStep = WORKFLOW_STEPS.find(s => s.num === sk.current_step);

        return {
          'No': 0,
          'Provinsi': getProvinsiNameFromData(sk.provinsi || '', provinsiList),
          'Kabupaten/Kota': getKabkotaNameFromData(sk.kabupaten || '', kabkotaList),
          'Kecamatan': sk.kecamatan || '-',
          'Desa': sk.desa || '-',
          'Skema': getSkemaNameFromData(sk.skema || '', skemaList),
          'Kelompok PS': sk.kelompok_ps || '-',
          'Luas (Ha)': sk.luas || '-',
          'Jumlah KK': sk.jml_kk || '-',
          'No Surat ND': sk.nomor_surat || '-',
          'Tanggal Surat ND': sk.tanggal_surat ? dayjs(sk.tanggal_surat).format('DD/MM/YYYY') : '-',
          'No ND': sk.nomor_nd_sk || '-',
          'Tanggal ND': sk.tanggal_nd_sk ? dayjs(sk.tanggal_nd_sk).format('DD/MM/YYYY') : '-',
          'No SK': sk.nomor_sk || '-',
          'Tanggal SK': sk.tanggal_sk ? dayjs(sk.tanggal_sk).format('DD/MM/YYYY') : '-',
          'Drafter': drafterStage?.assignee?.fullname || '-',
          'Finalisasi': finalisasiStage?.assignee?.fullname || '-',
          'Tahap Workflow': currentStep?.name || '-',
          'Status': sk.status || '-',
        };
      });

      // Add row numbers
      exportData.forEach((row: any, index: number) => {
        row['No'] = index + 1;
      });

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
      const fileName = `SK_Perhutanan_${timestamp}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { title: 'No', key: 'no', width: 50, render: (_: any, __: any, index: number) => (currentPage - 1) * pageSize + index + 1 },
    { title: 'No Surat ND', dataIndex: 'nomor_surat', key: 'nomor_surat', width: 150 },
    { title: 'No SK', dataIndex: 'nomor_sk', key: 'nomor_sk', width: 150 },
    {
      title: 'Kelompok PS',
      dataIndex: 'kelompok_ps',
      key: 'kelompok_ps',
      width: 180,
      render: (val: string) => (
        <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>{val || '-'}</div>
      ),
    },
    {
      title: 'Provinsi',
      key: 'provinsi_name',
      width: 150,
      render: (_: any, record: SKExport) => (
        <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>{record.provinsi_name || '-'}</div>
      ),
    },
    {
      title: 'Kabupaten',
      key: 'kabupaten_name',
      width: 150,
      render: (_: any, record: SKExport) => (
        <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>{record.kabupaten_name || '-'}</div>
      ),
    },
    {
      title: 'Skema',
      key: 'skema_name',
      width: 150,
      render: (_: any, record: SKExport) => (
        <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>{record.skema_name || '-'}</div>
      ),
    },
    { title: 'Luas (Ha)', dataIndex: 'luas', key: 'luas', width: 80 },
    { title: 'Jumlah KK', dataIndex: 'jml_kk', key: 'jml_kk', width: 80 },
    {
      title: 'Drafter',
      key: 'drafter',
      width: 120,
      render: (_: any, record: SKExport) => (
        <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>{record.drafter || '-'}</div>
      ),
    },
    {
      title: 'Finalisasi',
      key: 'finalisasi',
      width: 120,
      render: (_: any, record: SKExport) => (
        <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>{record.finalisasi || '-'}</div>
      ),
    },
    {
      title: 'Tahap Workflow',
      key: 'tahap_workflow',
      width: 180,
      render: (_: any, record: SKExport) => (
        <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>{record.tahap_workflow || '-'}</div>
      ),
    },
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
    <div>
      <Card
        title="Export SK Perhutanan"
        extra={
          <Space wrap>
            <Button icon={<DownloadOutlined />} onClick={handleExport} loading={exporting} disabled={data.length === 0}>
              Export Excel ({total} data)
            </Button>
          </Space>
        }
      >
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Cari..."
              prefix={<SearchOutlined />}
              allowClear
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={() => handleSearch(1)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              placeholder={['Tanggal Surat ND', 'Tanggal Akhir']}
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null]);
                handleSearch(1);
              }}
              format="DD/MM/YYYY"
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              value={selectedProvinsi}
              onChange={(val) => {
                setSelectedProvinsi(val);
                handleSearch(1);
              }}
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: '100%' }}
              options={provinsiOptions}
              placeholder="Pilih Provinsi"
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              value={selectedSkema}
              onChange={(val) => {
                setSelectedSkema(val);
                handleSearch(1);
              }}
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: '100%' }}
              options={skemaOptions}
              placeholder="Pilih Skema"
            />
          </Col>
        </Row>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <>
            <Table
              dataSource={data}
              columns={columns}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 1500 }}
            />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={handlePageChange}
                showSizeChanger
                showTotal={(t) => `Total ${t} data`}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
