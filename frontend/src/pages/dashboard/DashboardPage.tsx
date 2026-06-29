import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Space } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  LockOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { api } from '../../api/axios';

const { Title } = Typography;

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    totalPermissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, rolesRes, permsRes] = await Promise.all([
          api.get('/users?limit=1'),
          api.get('/roles'),
          api.get('/permissions'),
        ]);
        const allUsers = usersRes.data.data || [];
        const total = usersRes.data.pagination?.total || 0;
        const active = allUsers.filter((u: any) => u.status === 'ACTIVE').length || total;

        setStats({
          totalUsers: total,
          activeUsers: active || total,
          totalRoles: rolesRes.data.data?.length || 0,
          totalPermissions: permsRes.data.data?.length || 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Total Pengguna',
      value: stats.totalUsers,
      icon: <UserOutlined style={{ fontSize: 32, color: '#14b8a6' }} />,
      color: '#f0fdfb',
    },
    {
      title: 'Pengguna Aktif',
      value: stats.activeUsers,
      icon: <CheckCircleOutlined style={{ fontSize: 32, color: '#22c55e' }} />,
      color: '#f0fdf4',
    },
    {
      title: 'Total Role',
      value: stats.totalRoles,
      icon: <TeamOutlined style={{ fontSize: 32, color: '#3b82f6' }} />,
      color: '#eff6ff',
    },
    {
      title: 'Total Permission',
      value: stats.totalPermissions,
      icon: <LockOutlined style={{ fontSize: 32, color: '#a855f7' }} />,
      color: '#faf5ff',
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Dashboard</Title>
      <Row gutter={[16, 16]}>
        {cards.map((card, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card loading={loading} style={{ borderRadius: 12, background: card.color }}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Statistic valueStyle={{ fontSize: 28, fontWeight: 700 }} value={card.value} title={card.title} />
                  {card.icon}
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Selamat Datang di SETDIT" style={{ borderRadius: 12 }}>
            <p style={{ color: '#666', lineHeight: 1.8 }}>
              <strong>SETDIT</strong> (Sistem Terpadu) adalah platform manajemen pengguna
              dengan fitur Role-Based Access Control (RBAC). Sistem ini mendukung:
            </p>
            <ul style={{ color: '#666', lineHeight: 2 }}>
              <li>Manajemen pengguna dengan approval workflow</li>
              <li>Multi-role dan multi-permission per user</li>
              <li>OTP verification untuk keamanan</li>
              <li>WhatsApp gateway integration</li>
              <li>Audit log untuk seluruh aktivitas sistem</li>
            </ul>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Informasi Sistem" style={{ borderRadius: 12 }}>
            <ul style={{ color: '#666', lineHeight: 2 }}>
              <li><strong>Versi:</strong> 1.0.0</li>
              <li><strong>Database:</strong> PostgreSQL</li>
              <li><strong>Auth:</strong> JWT + Refresh Token</li>
              <li><strong>Security:</strong> Helmet + CORS + Rate Limit</li>
              <li><strong>ORM:</strong> Prisma</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  );
}