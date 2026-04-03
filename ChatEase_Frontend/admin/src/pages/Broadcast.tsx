import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    Input,
    Button,
    Radio,
    Upload,
    message,
    Alert,
    Divider,
    Table,
    Tag,
    Image,
    Space
} from 'antd';
import {
    SendOutlined,
    UploadOutlined,
    PictureOutlined,
    FileTextOutlined,
    HistoryOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import {
    sendBroadcast,
    uploadFile,
    getBroadcastList,
    type BroadcastDTO,
    type BroadcastItem
} from '../services/system';

const { TextArea } = Input;

const Broadcast: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [messageType, setMessageType] = useState<number>(0); // 0: Text, 1: Image
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    // History Table State
    const [historyList, setHistoryList] = useState<BroadcastItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5,
        total: 0
    });

    // Fetch Broadcast History
    const fetchHistory = async (page: number, size: number) => {
        setHistoryLoading(true);
        try {
            const res = await getBroadcastList(page, size);
            if (res) {
                setHistoryList(res.records);
                setPagination({
                    current: res.current,
                    pageSize: res.size,
                    total: res.total
                });
            }
        } catch (error) {
            console.error('Fetch history failed', error);
            message.error('Failed to load broadcast history');
        } finally {
            setHistoryLoading(false);
        }
    };

    // Load history on mount
    useEffect(() => {
        fetchHistory(1, 5);
    }, []);

    // Handle Form Submission (Send Broadcast)
    const onFinish = async (values: any) => {
        // Validation for Image Mode
        if (messageType === 1 && fileList.length === 0) {
            message.error('Please upload an image for Image Message type.');
            return;
        }

        setLoading(true);
        try {
            let filePath = '';

            // Step 1: Upload Image (if type is Image)
            if (messageType === 1 && fileList.length > 0) {
                const file = fileList[0].originFileObj as File;
                // Upload file to get URL
                filePath = await uploadFile(file);
                if (!filePath) {
                    throw new Error('Image upload failed, cannot send broadcast.');
                }
            }

            // Step 2: Send Broadcast
            const broadcastData: BroadcastDTO = {
                content: values.content,
                messageType: values.messageType,
                filePath: filePath || undefined,
            };

            await sendBroadcast(broadcastData);

            message.success('System broadcast sent successfully!');

            // Reset form
            form.resetFields();
            setFileList([]);
            setMessageType(0);

            // Refresh History Table (Go to first page)
            fetchHistory(1, pagination.pageSize);

        } catch (error: any) {
            console.error('Broadcast failed', error);
            message.error(error.message || 'Failed to send broadcast');
        } finally {
            setLoading(false);
        }
    };

    // Handle File Change
    const handleFileChange = ({ fileList: newFileList }: any) => {
        // Limit to 1 file
        setFileList(newFileList.slice(-1));
    };

    // Handle Table Pagination Change
    const handleTableChange = (page: number, pageSize: number) => {
        fetchHistory(page, pageSize);
    };

    // Table Columns Definition
    const columns = [
        {
            title: 'Time',
            dataIndex: 'createTime',
            key: 'createTime',
            width: 180,
            render: (text: string) => new Date(text).toLocaleString(),
        },
        {
            title: 'Type',
            dataIndex: 'messageType',
            key: 'messageType',
            width: 100,
            render: (type: number) => (
                type === 1
                    ? <Tag color="green" icon={<PictureOutlined />}>Image</Tag>
                    : <Tag color="blue" icon={<FileTextOutlined />}>Text</Tag>
            ),
        },
        {
            title: 'Content',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
        },
        {
            title: 'Media',
            dataIndex: 'filePath',
            key: 'filePath',
            width: 100,
            render: (url: string, record: BroadcastItem) => (
                record.messageType === 1 && url ? (
                    <Image
                        width={50}
                        src={url}
                        alt="Broadcast Media"
                        placeholder={true}
                    />
                ) : '-'
            ),
        },
        {
            title: 'Sender ID',
            dataIndex: 'senderId',
            key: 'senderId',
            width: 150,
            render: (id: string) => <Tag>{id}</Tag>,
        },
    ];

    return (
        <div className="broadcast-page">
            {/* Sending Section */}
            <Card title="Send System Broadcast" bordered={false} style={{ marginBottom: 24 }}>
                <Alert
                    message="Attention"
                    description="Broadcast messages will be sent to ALL users immediately via the System Robot. This action cannot be undone."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        messageType: 0,
                        content: '',
                    }}
                    onValuesChange={(changedValues) => {
                        if (changedValues.messageType !== undefined) {
                            setMessageType(changedValues.messageType);
                        }
                    }}
                >
                    <Form.Item
                        label="Message Type"
                        name="messageType"
                        rules={[{ required: true }]}
                    >
                        <Radio.Group buttonStyle="solid">
                            <Radio.Button value={0}>
                                <FileTextOutlined /> Text Message
                            </Radio.Button>
                            <Radio.Button value={1}>
                                <PictureOutlined /> Image Message
                            </Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item
                        label="Message Content"
                        name="content"
                        rules={[
                            { required: true, message: 'Please input message content' },
                            { max: 500, message: 'Content cannot exceed 500 characters' }
                        ]}
                        help={messageType === 1 ? "This text will be displayed as the caption for the image." : ""}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Enter your broadcast message here..."
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>

                    {messageType === 1 && (
                        <Form.Item
                            label="Upload Image"
                            required
                            tooltip="Supported formats: JPG, PNG. Max size: 5MB."
                        >
                            <Upload
                                listType="picture-card"
                                fileList={fileList}
                                onChange={handleFileChange}
                                beforeUpload={() => false} // Prevent auto upload
                                maxCount={1}
                                accept="image/*"
                            >
                                {fileList.length < 1 && (
                                    <div>
                                        <UploadOutlined />
                                        <div style={{ marginTop: 8 }}>Select Image</div>
                                    </div>
                                )}
                            </Upload>
                        </Form.Item>
                    )}

                    <Divider />

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SendOutlined />}
                            loading={loading}
                            size="large"
                            style={{ minWidth: 150 }}
                        >
                            Send Broadcast
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* History Section */}
            <Card
                title={<Space><HistoryOutlined /> Broadcast History</Space>}
                bordered={false}
            >
                <Table
                    columns={columns}
                    dataSource={historyList}
                    rowKey="broadcastId"
                    loading={historyLoading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onChange: handleTableChange,
                        showTotal: (total) => `Total ${total} items`,
                    }}
                />
            </Card>
        </div>
    );
};

export default Broadcast;