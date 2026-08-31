import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Space, Tag, Button, List, Avatar } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  RightOutlined,
  UserOutlined,
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
  TU_SETDITJEN: { name: 'Admin TU Setditjen', steps: [{ num: 10, name: 'Admin TU Penomoran ND', action: 'Penomoran ND' }, { num: 12, name: 'Admin TU Penomoran SK', action: 'Penomoran SK' }, { num: 17, name: 'Arsip & Scan', action: 'Arsip & scan final' }] },
  DIRJEN_PS: { name: 'Dirjen PS', steps: [{ num: 11, name: 'Dirjen PS', action: 'TTD ND' }] },
};

const STAT_CARDS = [
  {
    key: 'total',
    title: 'Total SK',
    icon: <FileTextOutlined />,
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    bg: '#eff6ff',
    color: '#2563eb',
  },
  {
    key: 'inProgress',
    title: 'Sedang Diproses',
    icon: <ClockCircleOutlined />,
    gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)',
    bg: '#fff7ed',
    color: '#ea580c',
  },
  {
    key: 'waitingRevision',
    title: 'Menunggu Revisi',
    icon: <ExclamationCircleOutlined />,
    gradient: 'linear-gradient(135deg, #eab308, #ca8a04)',
    bg: '#fefce8',
    color: '#ca8a04',
  },
  {
    key: 'completed',
    title: 'Selesai',
    icon: <CheckCircleOutlined />,
    gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
    bg: '#f0fdf4',
    color: '#16a34a',
  },
  {
    key: 'overdue',
    title: 'Lewat Deadline',
    icon: <WarningOutlined />,
    gradient: 'linear-gradient(135deg, #f43f5e, #dc2626)',
    bg: '#fff1f2',
    color: '#dc2626',
  },
];

const iconBadge = (gradient: string): React.CSSProperties => ({
  width: 48,
  height: 48,
  borderRadius: 14,
  background: gradient,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: 22,
  flexShrink: 0,
  boxShadow: '0 6px 14px rgba(0,0,0,0.12)',
});

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

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';

  return (
    <div>
      {/* Welcome Header */}
      <div
        style={{
          borderRadius: 16,
          padding: '28px 32px',
          marginBottom: 24,
          background: 'linear-gradient(120deg, #0f766e 0%, #0d9488 55%, #14b8a6 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -140, right: -60 }} />
        <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', bottom: -80, right: 200 }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <Avatar
            size={64}
            style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', fontSize: 26, fontWeight: 700, flexShrink: 0 }}
          >
            {user?.fullname?.charAt(0).toUpperCase() || <UserOutlined />}
          </Avatar>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
              {greeting},
            </Text>
            <Title style={{ color: '#fff', margin: 0, fontSize: 26, fontWeight: 700 }}>
              {user?.fullname || 'Pengguna'}
            </Title>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {userJabatanCodes.map((jabatanCode: string) => (
                <span
                  key={jabatanCode}
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 999,
                    padding: '3px 14px',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {getJabatanInfo(jabatanCode).name}
                </span>
              ))}
            </div>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: 14,
              padding: '14px 22px',
              textAlign: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{pendingList.length}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>Tugas menunggu</div>
          </div>
        </div>
      </div>

      {/* Statistik SK */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {STAT_CARDS.map((s) => (
          <Col xs={12} md={8} lg={Math.floor(24 / Math.min(STAT_CARDS.length, 5)) === 4 ? 4 : 4} key={s.key}>
            <Card
              loading={loading}
              style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
              styles={{ body: { padding: 20 } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={iconBadge(s.gradient)}>{s.icon}</div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>{s.title}</Text>
                  <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15, color: s.color }}>
                    {stats[s.key as keyof typeof stats]}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
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
                <span style={{ fontWeight: 700 }}>{info.name}</span>
                <Tag color="teal" style={{ borderRadius: 999, padding: '0 10px' }}>{tugasJabatan.length} tugas</Tag>
              </Space>
            }
            style={{ marginBottom: 16, borderRadius: 16, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
            extra={
              <Button type="link" onClick={() => navigate('/sk-perhutanan')} icon={<RightOutlined />}>
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
                        style={{ borderRadius: 8 }}
                      >
                        Proses
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            ...iconBadge(isOverdue ? 'linear-gradient(135deg, #f43f5e, #dc2626)' : 'linear-gradient(135deg, #f59e0b, #ea580c)'),
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            fontSize: 18,
                          }}
                        >
                          {isOverdue ? <WarningOutlined /> : <ExclamationCircleOutlined />}
                        </div>
                      }
                      title={
                        <Space wrap>
                          <Text strong>{sk.perihal || 'Tanpa Perihal'}</Text>
                          {isOverdue && <Tag color="red" style={{ borderRadius: 999 }}>LEWAT DEADLINE</Tag>}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">
                            <strong>{stepInfo.name}</strong> — {stepInfo.action}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            No. Surat: {sk.nomor_surat || '-'} · Deadline: {new Date(sk.tanggal_deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
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
        <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center', padding: 40 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 36,
              color: '#16a34a',
            }}
          >
            <CheckCircleOutlined />
          </div>
          <Title level={4} style={{ marginBottom: 4 }}>Semua Tugas Selesai!</Title>
          <Text type="secondary">Tidak ada SK yang menunggu proses untuk jabatan Anda saat ini.</Text>
        </Card>
      )}
    </div>
  );
}
