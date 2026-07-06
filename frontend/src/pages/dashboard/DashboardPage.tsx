import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, List, Tag, Button } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useRedux';
import { skPerhutananApi } from '../../api/skPerhutanan';

const { Title, Text } = Typography;

// Mapping jabatan ke nama dan step yang harus dilakukan
const JABATAN_STEPS: Record<string, { name: string; steps: { num: number; name: string; action: string }[] }> = {
  SEKDITJEN_PS: { name: 'Sekditjen PS', steps: [{ num: 2, name: 'Setditjen PS', action: 'Review & approve surat masuk' }] },
  KABAG_PEHKT: { name: 'Kabag PEHKT', steps: [{ num: 3, name: 'Kabag PEHK', action: 'Telaah & approve' }, { num: 7, name: 'Kabag PEHK', action: 'Telaah & approve' }, { num: 16, name: 'Kabag PEHK TTD Salinan', action: 'TTD Salinan & arsip' }] },
  ANGGOTA_POKJA_HUKUM: { name: 'Anggota Pokja Hukum', steps: [{ num: 5, name: 'Telaah Anggota', action: 'Telaah draft SK' }, { num: 14, name: 'Finalisasi Anggota', action: 'Finalisasi SK' }] },
  KETUA_POKJA_HUKUM: { name: 'Ketua Pokja Hukum', steps: [{ num: 4, name: 'Distribusi Ke Anggota', action: 'Distribusi ke anggota untuk telaah' }, { num: 6, name: 'Approve Ketua', action: 'Approve hasil telaah' }, { num: 13, name: 'Distribusi SK', action: 'Distribusi SK untuk finalisasi' }, { num: 15, name: 'Approve Finalisasi', action: 'Approve hasil finalisasi' }, { num: 17, name: 'Arsip & Scan', action: 'Arsip & scan final' }] },
  KASUBBAG_TU: { name: 'Kasubbag TU', steps: [{ num: 8, name: 'Kasubbag TU', action: 'Proses disposisi surat' }] },
  TU_SETDITJEN: { name: 'TU Setditjen', steps: [{ num: 10, name: 'Admin TU Penomoran ND', action: 'Penomoran ND' }, { num: 12, name: 'Admin TU Penomoran SK', action: 'Penomoran SK' }, { num: 17, name: 'Arsip & Scan', action: 'Arsip & scan final' }] },
  DIRJEN_PS: { name: 'Dirjen PS', steps: [{ num: 11, name: 'Dirjen PS', action: 'TTD ND' }] },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, waitingRevision: 0, completed: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  const userJabatanCodes = user?.jabatan_codes || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const skStatsRes = await skPerhutananApi.getStats();
        setStats(skStatsRes.data.data || { total: 0, inProgress: 0, waitingRevision: 0, completed: 0, overdue: 0 });

        // Fetch pending SK for each jabatan user
        const allPending: any[] = [];
        for (const jabatanCode of userJabatanCodes) {
          try {
            const res = await skPerhutananApi.getPendingByJabatan(jabatanCode);
            if (res.data.data) {
              allPending.push(...res.data.data.map((sk: any) => ({
                ...sk,
                myJabatan: jabatanCode,
                myJabatanName: JABATAN_STEPS[jabatanCode]?.name || jabatanCode,
              })));
            }
          } catch (e) {
            console.error(`Failed to fetch pending for ${jabatanCode}:`, e);
          }
        }
        setPendingList(allPending);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (userJabatanCodes.length > 0) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [userJabatanCodes]);

  const getJabatanInfo = (jabatanCode: string) => JABATAN_STEPS[jabatanCode] || { name: jabatanCode, steps: [] };

  const getStepInfo = (jabatanCode: string, currentStep: number) => {
    const info = getJabatanInfo(jabatanCode);
    const currentStepInfo = info.steps.find(s => s.num === currentStep);
    return currentStepInfo || { name: `Step ${currentStep}`, action: '-' };
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Dashboard</Title>

      {/* Info Jabatan User */}
      <Card style={{ marginBottom: 24, borderRadius: 12, background: '#f6ffed' }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Text strong style={{ fontSize: 16 }}>Jabatan Anda:</Text>
          <Space wrap>
            {userJabatanCodes.map((jabatanCode: string) => {
              const info = getJabatanInfo(jabatanCode);
              return (
                <Tag key={jabatanCode} color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
                  {info.name}
                </Tag>
              );
            })}
          </Space>
          <Text type="secondary" style={{ marginTop: 8 }}>
            {user?.fullname} - Anda memiliki {pendingList.length} tugas yang menunggu
          </Text>
        </Space>
      </Card>

      {/* Statistik SK */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card loading={loading} style={{ borderRadius: 12, background: '#e6f4ff' }}>
            <Statistic
              valueStyle={{ fontSize: 28, fontWeight: 700 }}
              value={stats.total}
              title="Total SK"
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading} style={{ borderRadius: 12, background: '#fff7e6' }}>
            <Statistic
              valueStyle={{ fontSize: 28, fontWeight: 700 }}
              value={stats.inProgress}
              title="Sedang Diproses"
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading} style={{ borderRadius: 12, background: '#fffbe6' }}>
            <Statistic
              valueStyle={{ fontSize: 28, fontWeight: 700 }}
              value={stats.waitingRevision}
              title="Menunggu Revisi"
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading} style={{ borderRadius: 12, background: '#f6ffed' }}>
            <Statistic
              valueStyle={{ fontSize: 28, fontWeight: 700 }}
              value={stats.completed}
              title="Selesai"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading} style={{ borderRadius: 12, background: '#fff2f0' }}>
            <Statistic
              valueStyle={{ fontSize: 28, fontWeight: 700 }}
              value={stats.overdue}
              title="Lewat Deadline"
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Daftar Tugas per Jabatan */}
      {userJabatanCodes.map((jabatanCode: string) => {
        const info = getJabatanInfo(jabatanCode);
        const tugasJabatan = pendingList.filter(sk => sk.myJabatan === jabatanCode);

        if (tugasJabatan.length === 0) return null;

        return (
          <Card
            key={jabatanCode}
            title={
              <Space>
                <span>{info.name}</span>
                <Tag color="blue">{tugasJabatan.length} tugas</Tag>
              </Space>
            }
            style={{ marginBottom: 16, borderRadius: 12 }}
            extra={
              <Button type="link" onClick={() => navigate('/sk-perhutanan')}>
                Lihat Semua
              </Button>
            }
          >
            <List
              loading={loading}
              dataSource={tugasJabatan.slice(0, 5)}
              renderItem={(sk: any) => {
                const stepInfo = getStepInfo(jabatanCode, sk.current_step);
                const isOverdue = new Date(sk.tanggal_deadline) < new Date() && sk.status !== 'COMPLETED';
                return (
                  <List.Item
                    actions={[
                      <Button
                        key="process"
                        type="primary"
                        size="small"
                        onClick={() => navigate(`/sk-perhutanan?detail=${sk.id}`)}
                      >
                        Proses
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        isOverdue
                          ? <WarningOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                          : <ExclamationCircleOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                      }
                      title={
                        <Space>
                          <Text strong>{sk.perihal || 'Tanpa Perihal'}</Text>
                          {isOverdue && <Tag color="red">LEWAT DEADLINE</Tag>}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">
                            <strong>{stepInfo.name}</strong> - {stepInfo.action}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            No. Surat: {sk.nomor_surat || '-'} | Deadline: {new Date(sk.tanggal_deadline).toLocaleDateString('id-ID')}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
              locale={{ emptyText: 'Tidak ada tugas untuk jabatan ini' }}
            />
          </Card>
        );
      })}

      {/* Jika tidak ada tugas */}
      {pendingList.length === 0 && !loading && (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: 40 }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
          <Title level={4}>Semua Tugas Selesai!</Title>
          <Text type="secondary">Tidak ada SK yang menunggu proses untuk jabatan Anda saat ini.</Text>
        </Card>
      )}
    </div>
  );
}