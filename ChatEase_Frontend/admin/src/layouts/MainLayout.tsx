import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, message, theme } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CloudUploadOutlined,
  SettingOutlined,
  LogoutOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RobotOutlined,
  NotificationOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../services/auth';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get design tokens for consistent coloring (White/Blue theme)
  const {
    token: { colorBgContainer, borderRadiusLG, colorPrimary },
  } = theme.useToken();

  // State to store admin name
  const [adminName, setAdminName] = useState<string>('Admin');

  // Load admin info on mount
  useEffect(() => {
    const storedName = localStorage.getItem('adminName');
    if (storedName) {
      setAdminName(storedName);
    }
  }, []);

  // Handle Menu Click
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // Handle Logout
  const handleLogout = () => {
    logout();
    message.success('Logged out successfully');
    navigate('/login');
  };

  // Dropdown menu items for User Profile
  const userMenuItems = [
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  // Sidebar Menu Items
  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'User Management',
    },
    {
      key: '/groups',
      icon: <TeamOutlined />,
      label: 'Group Management',
    },
    {
      key: '/versions',
      icon: <CloudUploadOutlined />,
      label: 'App Versions',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'System Settings',
      children: [
        {
          key: '/settings/robot',
          icon: <RobotOutlined />,
          label: 'Robot Config',
        },
        {
          key: '/broadcast',
          icon: <NotificationOutlined />,
          label: 'System Broadcast',
        }
      ]
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar - Light theme for "White dominant" style */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        style={{
          borderRight: '1px solid #f0f0f0',
        }}
      >
        {/* Logo Area */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          {/* Simple Logo Placeholder */}
          <div style={{
            color: colorPrimary,
            fontSize: 20,
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            transition: 'all 0.3s'
          }}>
            {collapsed ? 'CE' : 'ChatEase Admin'}
          </div>
        </div>

        {/* Navigation Menu */}
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/settings']}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>

      {/* Main Layout Area */}
      <Layout>
        {/* Top Header */}
        <Header style={{
          padding: '0 24px',
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0'
        }}>
          {/* Left: Collapse Trigger */}
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: () => setCollapsed(!collapsed),
            style: { fontSize: '18px', cursor: 'pointer' }
          })}

          {/* Right: User Profile Dropdown */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                style={{ backgroundColor: colorPrimary }}
                icon={<UserOutlined />}
              />
              <span style={{ fontWeight: 500 }}>{adminName}</span>
            </Space>
          </Dropdown>
        </Header>

        {/* Content Area */}
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
          {/* Outlet renders the child route component */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;