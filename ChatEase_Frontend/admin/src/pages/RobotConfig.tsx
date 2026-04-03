import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    Input,
    Button,
    message,
    Avatar,
    Row,
    Col,
    Typography,
    Divider,
    Skeleton
} from 'antd';
import {
    SaveOutlined,
    RobotOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import {
    getRobotConfig,
    updateRobotConfig,
    type RobotConfigDTO
} from '../services/system';

const { Title, Text } = Typography;
const { TextArea } = Input;

const RobotConfig: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    // Local state for previewing avatar changes instantly
    const [previewAvatar, setPreviewAvatar] = useState('');
    const [previewName, setPreviewName] = useState('System Robot');

    // Fetch Robot Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getRobotConfig();
            if (res) {
                form.setFieldsValue(res);
                setPreviewAvatar(res.avatar || '');
                setPreviewName(res.name || 'System Robot');
            }
        } catch (error) {
            console.error('Fetch robot info failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle Form Submission
    const onFinish = async (values: RobotConfigDTO) => {
        setSubmitting(true);
        try {
            await updateRobotConfig(values);
            message.success('Robot configuration updated successfully');
            // Refresh data to ensure consistency
            fetchData();
        } catch (error) {
            console.error('Update robot failed', error);
        } finally {
            setSubmitting(false);
        }
    };

    // Watch for form changes to update preview
    const handleValuesChange = (changedValues: any, allValues: any) => {
        if (changedValues.avatar !== undefined) {
            setPreviewAvatar(changedValues.avatar);
        }
        if (changedValues.name !== undefined) {
            setPreviewName(changedValues.name);
        }
    };

    return (
        <div className="robot-config-page">
            <Card
                title="Robot Configuration"
                bordered={false}
                extra={
                    <Button icon={<ReloadOutlined />} onClick={fetchData} disabled={loading}>
                        Reset
                    </Button>
                }
            >
                <Row gutter={[32, 32]}>
                    {/* Left Column: Configuration Form */}
                    <Col xs={24} md={14} lg={16}>
                        {loading ? (
                            <Skeleton active paragraph={{ rows: 6 }} />
                        ) : (
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                onValuesChange={handleValuesChange}
                                initialValues={{
                                    name: 'System Robot',
                                    welcomeMessage: 'Welcome to ChatEase!',
                                }}
                            >
                                <Form.Item
                                    label="Robot Name"
                                    name="name"
                                    rules={[
                                        { required: true, message: 'Please input robot name' },
                                        { max: 20, message: 'Name cannot exceed 20 characters' }
                                    ]}
                                >
                                    <Input placeholder="e.g., ChatEase Assistant" maxLength={20} showCount />
                                </Form.Item>

                                <Form.Item
                                    label="Avatar URL"
                                    name="avatar"
                                    rules={[
                                        { type: 'url', message: 'Please enter a valid URL' }
                                    ]}
                                    extra="Enter a direct image link (http/https)."
                                >
                                    <Input prefix={<RobotOutlined />} placeholder="https://example.com/robot.png" />
                                </Form.Item>

                                <Form.Item
                                    label="Welcome Message"
                                    name="welcomeMessage"
                                    rules={[
                                        { max: 200, message: 'Message cannot exceed 200 characters' }
                                    ]}
                                    tooltip="This message is sent automatically when a new user joins."
                                >
                                    <TextArea
                                        rows={4}
                                        placeholder="Hello! How can I help you today?"
                                        maxLength={200}
                                        showCount
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        icon={<SaveOutlined />}
                                        loading={submitting}
                                        block
                                    >
                                        Save Changes
                                    </Button>
                                </Form.Item>
                            </Form>
                        )}
                    </Col>

                    {/* Right Column: Live Preview */}
                    <Col xs={24} md={10} lg={8}>
                        <Card
                            type="inner"
                            title="Preview"
                            style={{ textAlign: 'center', backgroundColor: '#f9f9f9' }}
                        >
                            <div style={{ marginBottom: 20 }}>
                                <Avatar
                                    size={100}
                                    src={previewAvatar}
                                    icon={<RobotOutlined />}
                                    style={{ backgroundColor: '#1677ff' }}
                                />
                            </div>
                            <Title level={4} style={{ margin: 0 }}>{previewName}</Title>
                            <Text type="secondary">System Assistant</Text>

                            <Divider dashed />

                            <div style={{ textAlign: 'left' }}>
                                <Text strong>Status:</Text> <Text type="success">Online</Text>
                                <br />
                                <Text strong>Role:</Text> System Admin
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default RobotConfig;