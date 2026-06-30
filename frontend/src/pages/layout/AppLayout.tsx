import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Drawer } from 'antd';
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
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { logout } from '../../store/authSlice';
import { menusApi, Menu as MenuItem } from '../../api/menus';
import { authApi } from '../../api/auth';
import { settingsApi, Settings } from '../../api/settings';

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
  '/master/provinsi': 'Master Provinsi',
  '/master/kabkota': 'Master Kabupaten/Kota',
  '/master/skema': 'Master Skema',
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
  { key: '/master/provinsi', icon: <FileTextOutlined />, label: 'Provinsi' },
  { key: '/master/kabkota', icon: <FileTextOutlined />, label: 'Kabupaten/Kota' },
  { key: '/master/skema', icon: <FileTextOutlined />, label: 'Skema' },
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
  UsergroupAddOutlined: <UserOutlined />,
  FileTextOutlined: <FileTextOutlined />,
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dynamicMenuItems, setDynamicMenuItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isMobile, setIsMobile] = useState(false);
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
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
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
            borderBottom: '1px solid #f0f0f0',
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
                width: 32,
                height: 32,
                background: '#14b8a6',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {settings?.logo_initial || settings?.app_name?.charAt(0) || 'S'}
            </div>
          )}
          {!collapsed && (
            <span style={{ marginLeft: 12, fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>
              {settings?.app_name || 'SETDIT'}
            </span>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={dynamicMenuItems.length > 0 ? dynamicMenuItems : menuItems}
          onClick={({ key }) => {
            navigate(key);
            if (isMobile) setDrawerOpen(false);
          }}
          style={{ border: 'none', padding: '8px 0' }}
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
                  width: 28,
                  height: 28,
                  background: '#14b8a6',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12,
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
          style={{ border: 'none', padding: '8px 0' }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mobile hamburger menu */}
            {isMobile ? (
              <div
                onClick={() => setDrawerOpen(true)}
                style={{ cursor: 'pointer', fontSize: 20, padding: '0 8px' }}
              >
                <MenuOutlined />
              </div>
            ) : (
              <div
                onClick={() => setCollapsed(!collapsed)}
                style={{ cursor: 'pointer', fontSize: 18, padding: '0 8px' }}
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar style={{ background: '#14b8a6' }}>
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