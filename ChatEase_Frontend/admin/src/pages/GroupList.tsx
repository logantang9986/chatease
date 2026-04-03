import React, { useState, useEffect } from 'react';
import {
    Table,
    Card,
    Input,
    Button,
    Space,
    Avatar,
    Popconfirm,
    message,
    Tooltip
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    DeleteOutlined,
    TeamOutlined
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import {
    getGroupList,
    disbandGroup,
    type GroupItem
} from '../services/group';

const GroupList: React.FC = () => {
    // State Management
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<GroupItem[]>([]);
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
            const res = await getGroupList(page, size, searchKeyword);
            setData(res.records);
            setPagination({
                current: res.current,
                pageSize: res.size,
                total: res.total,
            });
        } catch (error) {
            console.error('Fetch groups failed', error);
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
    const handleTableChange: TableProps<GroupItem>['onChange'] = (newPagination) => {
        fetchData(newPagination.current || 1, newPagination.pageSize || 10, keyword);
    };

    // Handle Disband Group
    const handleDisband = async (groupId: string) => {
        try {
            await disbandGroup(groupId);
            message.success('Group disbanded successfully');
            // Refresh list
            fetchData(pagination.current, pagination.pageSize, keyword);
        } catch (error) {
            console.error('Disband group failed', error);
        }
    };

    // Table Columns Configuration
    const columns: TableProps<GroupItem>['columns'] = [
        {
            title: 'Group Avatar',
            dataIndex: 'groupAvatar', // Updated to match backend field 'groupAvatar'
            key: 'groupAvatar',
            render: (text) => <Avatar src={text} icon={<TeamOutlined />} />,
            width: 100,
        },
        {
            title: 'Group ID',
            dataIndex: 'groupId',
            key: 'groupId',
            ellipsis: true,
        },
        {
            title: 'Group Name',
            dataIndex: 'groupName',
            key: 'groupName',
        },
        {
            title: 'Owner ID',
            dataIndex: 'groupOwnerId',
            key: 'groupOwnerId',
            ellipsis: true,
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
                    {/* Disband Button */}
                    <Popconfirm
                        title="Disband this group?"
                        description={`Are you sure you want to disband "${record.groupName}"? This action cannot be undone.`}
                        onConfirm={() => handleDisband(record.groupId)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Disband Group">
                            <Button type="link" danger icon={<DeleteOutlined />}>
                                Disband
                            </Button>
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="group-list-page">
            <Card title="Group Management" bordered={false}>
                {/* Toolbar: Search and Refresh */}
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <Space>
                        <Input.Search
                            placeholder="Search by group name"
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
                    rowKey="groupId"
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} groups`,
                    }}
                    loading={loading}
                    onChange={handleTableChange}
                />
            </Card>
        </div>
    );
};

export default GroupList;