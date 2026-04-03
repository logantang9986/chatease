import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Skeleton } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import { getDashboardStats, type DashboardStatsDTO } from '../services/system';

const Dashboard: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<DashboardStatsDTO>({
        userCount: 0,
        groupCount: 0,
    });

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await getDashboardStats();
            if (res) {
                setStats(res);
            }
        } catch (error) {
            console.error('Fetch dashboard stats failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return (
        <div>
            <h2 style={{ marginBottom: 16 }}>Dashboard</h2>

            {/* Statistics Section */}
            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card bordered={false}>
                        {loading ? (
                            <Skeleton active paragraph={{ rows: 1 }} />
                        ) : (
                            <Statistic
                                title="Total Users"
                                value={stats.userCount}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#3f8600' }}
                            />
                        )}
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card bordered={false}>
                        {loading ? (
                            <Skeleton active paragraph={{ rows: 1 }} />
                        ) : (
                            <Statistic
                                title="Total Groups"
                                value={stats.groupCount}
                                prefix={<TeamOutlined />}
                                valueStyle={{ color: '#1677ff' }}
                            />
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Welcome Section */}
            <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
                <p>Welcome to ChatEase Admin System.</p>
                <p>Select a module from the left sidebar to begin.</p>
            </div>
        </div>
    );
};

export default Dashboard;