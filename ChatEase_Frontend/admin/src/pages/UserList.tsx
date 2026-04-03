import React, { useState, useEffect } from 'react';
import {
    Table,
    Card,
    Input,
    Button,
    Space,
    Tag,
    Avatar,
    Popconfirm,
    message,
    Tooltip
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    LogoutOutlined,
    UserOutlined
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import {
    getUserList,
    updateUserStatus,
    forceLogout,
    type UserItem
} from '../services/user';

const UserList: React.FC = () => {
    // State Management
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<UserItem[]>([]);
    const [keyword, setKeyword] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    // Fetch Data Function
    const fetchData = async (page = 1, size = 10, searchKeyword = '') => {
        setLoading(true);
        try {
            const res = await getUserList(page, size, searchKeyword);
            setData(res.records);
            setPagination({
                current: res.current,
                pageSize: res.size,
                total: res.total,
            });
        } catch (error) {
            console.error('Fetch users failed', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchData(pagination.current, pagination.pageSize, keyword);
    }, []);

    // Handle Search
    const handleSearch = (value: string) => {
        setKeyword(value);
        // Reset to page 1 on search
        fetchData(1, pagination.pageSize, value);
    };

    // Handle Table Change (Pagination)
    const handleTableChange: TableProps<UserItem>['onChange'] = (newPagination) => {
        fetchData(newPagination.current || 1, newPagination.pageSize || 10, keyword);
    };

    // Handle Ban / Unban
    const handleStatusChange = async (userId: string, currentStatus: number) => {
        // Toggle status: 1 (Active) -> 0 (Banned), 0 -> 1
        const newStatus = currentStatus === 1 ? 0 : 1;
        const actionText = newStatus === 0 ? 'banned' : 'activated';

        try {
            await updateUserStatus({ userId, status: newStatus });
            message.success(`User ${actionText} successfully`);
            // Refresh list to show new status
            fetchData(pagination.current, pagination.pageSize, keyword);
        } catch (error) {
            console.error('Update status failed', error);
        }
    };

    // Handle Force Logout
    const handleForceLogout = async (userId: string) => {
        try {
            await forceLogout(userId);
            message.success('User forced logout successfully');
        } catch (error) {
            console.error('Force logout failed', error);
        }
    };

    // Table Columns Configuration
    const columns: TableProps<UserItem>['columns'] = [
        {
            title: 'Avatar',
            dataIndex: 'avatar',
            key: 'avatar',
            render: (text) => <Avatar src={text} icon={<UserOutlined />} />,
            width: 80,
        },
        {
            title: 'User ID',
            dataIndex: 'userId',
            key: 'userId',
            ellipsis: true,
        },
        {
            title: 'Username',
            dataIndex: 'nickName', // Updated to match backend field 'nickName'
            key: 'nickName',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 1 ? 'green' : 'red'}>
                    {status === 1 ? 'Active' : 'Banned'}
                </Tag>
            ),
        },
        {
            title: 'Created At',
            dataIndex: 'createTime',
            key: 'createTime',
            width: 180,
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    {/* Ban/Unban Button */}
                    <Popconfirm
                        title={record.status === 1 ? 'Ban this user?' : 'Activate this user?'}
                        description={`Are you sure you want to ${record.status === 1 ? 'ban' : 'unban'} user ${record.nickName}?`}
                        onConfirm={() => handleStatusChange(record.userId, record.status)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="link"
                            danger={record.status === 1}
                            style={{ padding: 0 }}
                        >
                            {record.status === 1 ? 'Ban' : 'Unban'}
                        </Button>
                    </Popconfirm>

                    {/* Force Logout Button */}
                    <Popconfirm
                        title="Force Logout?"
                        description="This will disconnect the user immediately."
                        onConfirm={() => handleForceLogout(record.userId)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Force user offline">
                            <Button type="text" icon={<LogoutOutlined />} danger />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="user-list-page">
            <Card title="User Management" bordered={false}>
                {/* Toolbar: Search and Refresh */}
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <Space>
                        <Input.Search
                            placeholder="Search by username or email"
                            allowClear
                            enterButton={<Button type="primary" icon={<SearchOutlined />}>Search</Button>}
                            size="middle"
                            onSearch={handleSearch}
                            style={{ width: 300 }}
                        />
                    </Space>

                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => fetchData(pagination.current, pagination.pageSize, keyword)}
                    >
                        Refresh
                    </Button>
                </div>

                {/* Data Table */}
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="userId"
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} users`,
                    }}
                    loading={loading}
                    onChange={handleTableChange}
                />
            </Card>
        </div>
    );
};

export default UserList;