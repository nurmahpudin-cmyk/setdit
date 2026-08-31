import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Drawer, Button, Badge, Tooltip, Popover, List, Tag, Empty, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  LockOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AuditOutlined,
  BookOutlined,
  BankOutlined,
  UnorderedListOutlined,
  MenuOutlined,
  WhatsAppOutlined,
  CalendarOutlined,
  FileTextOutlined,
  FolderOutlined,
  ScheduleOutlined,
  ClusterOutlined,
  GlobalOutlined,
  AimOutlined,
  AppstoreOutlined,
  PlusSquareOutlined,
  ToolOutlined,
  SafetyOutlined,
  KeyOutlined,
  CustomerServiceOutlined,
  SearchOutlined,
  BarChartOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { logout } from '../../store/authSlice';
import { menusApi, Menu as MenuItem } from '../../api/menus';
import { authApi } from '../../api/auth';
import { settingsApi, Settings } from '../../api/settings';
import { notificationsApi, Notification } from '../../api/notifications';

const { Text } = Typography;

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/users': 'Manajemen Pengguna',
  '/roles': 'Manajemen Role',
  '/permissions': 'Manajemen Permission',
  '/menus': 'Manajemen Menu',
  '/positions': 'Manajemen Jabatan',
  '/units': 'Manajemen Unit Kerja',
  '/settings': 'Pengaturan',
  '/logs': 'Log Aktivitas',
  '/whatsapp': 'WhatsApp Gateway',
  '/jadwal-pimpinan': 'Jadwal Pimpinan',
  '/pegawai': 'Data Pegawai',
  '/sk-perhutanan': 'SK Perhutanan Sosial',
  '/proceed-sk': 'Pencarian Proses SK',
  '/stats-sk': 'Statistik SK',
  '/monitoring-dashboard': 'Monitoring SK',
  '/disposisi-surat': 'Disposisi Surat',
  '/master/provinsi': 'Master Provinsi',
  '/master/kabkota': 'Master Kabupaten/Kota',
  '/master/skema': 'Master Skema',
  '/master/jenis-surat': 'Master Jenis Surat',
};

const { Header, Sider, Content } = Layout;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getLogoUrl = (logo: string | undefined) => {
  if (!logo) return undefined;
  if (logo.startsWith('http')) return logo;
  return `${API_URL.replace('/api', '')}${logo}`;
};

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/sk-perhutanan', icon: <FileTextOutlined />, label: 'SK Perhutanan' },
  { key: '/proceed-sk', icon: <SearchOutlined />, label: 'Pencarian Proses SK' },
  { key: '/stats-sk', icon: <BarChartOutlined />, label: 'Statistik SK' },
  { key: '/monitoring-dashboard', icon: <DashboardOutlined />, label: 'Monitoring SK' },
  { key: '/master/provinsi', icon: <FileTextOutlined />, label: 'Provinsi' },
  { key: '/master/kabkota', icon: <FileTextOutlined />, label: 'Kabupaten/Kota' },
  { key: '/master/skema', icon: <FileTextOutlined />, label: 'Skema' },
  { key: '/master/jenis-surat', icon: <FileTextOutlined />, label: 'Jenis Surat' },
  { key: '/users', icon: <UserOutlined />, label: 'Pengguna' },
  { key: '/roles', icon: <TeamOutlined />, label: 'Role' },
  { key: '/permissions', icon: <LockOutlined />, label: 'Permission' },
  { key: '/menus', icon: <UnorderedListOutlined />, label: 'Menu' },
  { key: '/positions', icon: <BookOutlined />, label: 'Jabatan' },
  { key: '/units', icon: <BankOutlined />, label: 'Unit Kerja' },
  { key: '/whatsapp', icon: <WhatsAppOutlined />, label: 'WhatsApp' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Pengaturan' },
  { key: '/logs', icon: <AuditOutlined />, label: 'Log Aktivitas' },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  UserOutlined: <UserOutlined />,
  TeamOutlined: <TeamOutlined />,
  LockOutlined: <LockOutlined />,
  BookOutlined: <BookOutlined />,
  BankOutlined: <BankOutlined />,
  SettingOutlined: <SettingOutlined />,
  AuditOutlined: <AuditOutlined />,
  UnorderedListOutlined: <UnorderedListOutlined />,
  MenuOutlined: <MenuOutlined />,
  WhatsAppOutlined: <WhatsAppOutlined />,
  CalendarOutlined: <CalendarOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  FolderOutlined: <FolderOutlined />,
  ScheduleOutlined: <ScheduleOutlined />,
  ClusterOutlined: <ClusterOutlined />,
  GlobalOutlined: <GlobalOutlined />,
  AimOutlined: <AimOutlined />,
  AppstoreOutlined: <AppstoreOutlined />,
  PlusSquareOutlined: <PlusSquareOutlined />,
  ToolOutlined: <ToolOutlined />,
  SafetyOutlined: <SafetyOutlined />,
  KeyOutlined: <KeyOutlined />,
  CustomerServiceOutlined: <CustomerServiceOutlined />,
  SearchOutlined: <SearchOutlined />,
  // Aliases
  UsergroupAddOutlined: <TeamOutlined />,
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dynamicMenuItems, setDynamicMenuItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth < 992) {
        setCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchSettings = async () => {
    try {
      const s = await settingsApi.get();
      setSettings(s);
    } catch { /* ignore */ }
  };

  const fetchVisibleMenus = async () => {
    try {
      const res = await menusApi.getVisibleMenus();
      const menus: MenuItem[] = res.data.data;

      const items = menus
        .filter((m) => !m.parent_id)
        .map((m) => {
          const children = menus
            .filter((c) => c.parent_id === m.id)
            .map((c) => ({ key: c.path || `/menu-${c.id}`, label: c.name, icon: ICON_MAP[c.icon] || <MenuOutlined /> }));

          const icon = ICON_MAP[m.icon] || <MenuOutlined />;

          if (children.length > 0) {
            return { key: m.path || `/menu-${m.id}`, icon, label: m.name, children };
          }
          return { key: m.path || `/menu-${m.id}`, icon, label: m.name };
        });

      setDynamicMenuItems(items);
    } catch { /* use static fallback */ }
  };

  useEffect(() => { fetchSettings(); }, []);
  useEffect(() => { fetchVisibleMenus(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.getAll({ page: 1, limit: 10 });
      setNotifications(res.data.data?.items || []);
      setUnreadCount(res.data.data?.unread_count || 0);
    } catch { /* ignore - non-authenticated or no access */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      try {
        await notificationsApi.markRead(n.id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      } catch { /* ignore */ }
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
    } catch { /* ignore */ }
  };

  // Set document.title based on current route
  useEffect(() => {
    const pageTitle = PAGE_TITLES[location.pathname];
    if (settings) {
      document.title = pageTitle ? `${pageTitle} - ${settings.app_name}` : settings.app_name;
    } else {
      document.title = pageTitle || 'SETDIT';
    }
  }, [location.pathname, settings]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    dispatch(logout());
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: user?.fullname || 'User' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Keluar', onClick: handleLogout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar - always visible on lg+ */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        style={{
          background: 'linear-gradient(180deg, #0c3835 0%, #0a2e2b 100%)',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          overflow: 'auto',
          display: isMobile ? 'none' : 'block',
        }}
        width={240}
        collapsedWidth={80}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {settings?.logo ? (
            <img
              src={getLogoUrl(settings.logo)}
              alt={settings.app_name}
              style={{ height: 32, objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(13,148,136,0.4)',
              }}
            >
              {settings?.logo_initial || settings?.app_name?.charAt(0) || 'S'}
            </div>
          )}
          {!collapsed && (
            <span style={{ marginLeft: 12, fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: 0.3 }}>
              {settings?.app_name || 'SETDIT'}
            </span>
          )}
        </div>

        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[location.pathname]}
          items={dynamicMenuItems.length > 0 ? dynamicMenuItems : menuItems}
          onClick={({ key }) => {
            navigate(key);
            if (isMobile) setDrawerOpen(false);
          }}
          style={{ border: 'none', padding: '12px 0', background: 'transparent' }}
        />
      </Sider>

      {/* Mobile Drawer Sidebar */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {settings?.logo ? (
              <img src={getLogoUrl(settings.logo)} alt={settings.app_name} style={{ height: 28, objectFit: 'contain' }} />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                  borderRadius: 9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {settings?.logo_initial || settings?.app_name?.charAt(0) || 'S'}
              </div>
            )}
            <span style={{ fontWeight: 700, fontSize: 16 }}>{settings?.app_name || 'SETDIT'}</span>
          </div>
        }
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={280}
        styles={{ body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={dynamicMenuItems.length > 0 ? dynamicMenuItems : menuItems}
          onClick={({ key }) => {
            navigate(key);
            setDrawerOpen(false);
          }}
          style={{ border: 'none', padding: '12px 0' }}
        />
      </Drawer>

      <Layout style={{
        marginLeft: isMobile ? 0 : (collapsed ? 80 : 240),
        transition: 'margin-left 0.2s',
        minHeight: '100vh',
      }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {/* Mobile hamburger menu */}
            {isMobile ? (
              <Button
                type="text"
                onClick={() => setDrawerOpen(true)}
                icon={<MenuOutlined style={{ fontSize: 18 }} />}
              />
            ) : (
              <Button
                type="text"
                onClick={() => setCollapsed(!collapsed)}
                icon={collapsed ? <MenuUnfoldOutlined style={{ fontSize: 17 }} /> : <MenuFoldOutlined style={{ fontSize: 17 }} />}
              />
            )}
            {!isMobile && (
              <span style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {PAGE_TITLES[location.pathname] || 'Dashboard'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Popover
              trigger="click"
              placement="bottomRight"
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <span>Notifikasi</span>
                  {unreadCount > 0 && (
                    <Button type="link" size="small" onClick={handleMarkAllRead}>
                      Tandai semua dibaca
                    </Button>
                  )}
                </div>
              }
              content={
                notifications.length === 0 ? (
                  <Empty description="Tidak ada notifikasi" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <List
                    style={{ width: 340, maxHeight: 400, overflow: 'auto' }}
                    dataSource={notifications}
                    renderItem={(n: Notification) => (
                      <List.Item
                        onClick={() => handleNotificationClick(n)}
                        style={{ cursor: 'pointer', background: n.is_read ? 'transparent' : '#f0fdfa', borderRadius: 8, padding: '8px 12px' }}
                      >
                        <List.Item.Meta
                          title={
                            <Space size={8}>
                              <Text strong style={{ fontSize: 14 }}>{n.title}</Text>
                              {!n.is_read && <Badge dot color="red" />}
                            </Space>
                          }
                          description={
                            <div>
                              <div style={{ fontSize: 13, color: '#4b5563' }}>{n.message}</div>
                              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                                {new Date(n.created_at).toLocaleString('id-ID')}
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )
              }
            >
              <Tooltip title="Notifikasi">
                <div style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                  <Badge count={unreadCount} size="small">
                    <BellOutlined style={{ fontSize: 18, color: '#1f2937' }} />
                  </Badge>
                </div>
              </Tooltip>
            </Popover>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 10px', borderRadius: 999, transition: 'background 0.2s' }} className="user-chip">
                <Avatar style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)', fontWeight: 600 }}>
                  {user?.fullname?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <span style={{ fontWeight: 500 }} className="hidden-mobile">{user?.fullname || 'User'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{
          margin: isMobile ? 16 : 24,
          minHeight: 280,
          padding: isMobile ? '0 8px' : 0,
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}