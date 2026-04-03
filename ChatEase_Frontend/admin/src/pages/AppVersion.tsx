import React, { useState, useEffect } from 'react';
import {
    Table,
    Card,
    Button,
    Modal,
    Form,
    Input,
    Upload,
    message,
    Tag,
    Space
} from 'antd';
import {
    CloudUploadOutlined,
    ReloadOutlined,
    UploadOutlined,
    FileOutlined
} from '@ant-design/icons';
import type { TableProps, UploadFile } from 'antd';
import {
    getVersionList,
    publishAppVersion,
    type AppVersionItem
} from '../services/system';

const { TextArea } = Input;

const AppVersion: React.FC = () => {
    // State for Table
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<AppVersionItem[]>([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    // State for Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [form] = Form.useForm();

    // Helper: Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Fetch Version History
    const fetchData = async (page = 1, size = 10) => {
        setLoading(true);
        try {
            const res = await getVersionList(page, size);
            // The backend returns { content: [], totalElements: 0 } for Page objects usually
            // Adjust according to your exact backend response structure
            // Assuming standard structure based on service definition:
            if (res && Array.isArray(res.content)) {
                setData(res.content);
                setPagination({
                    current: page,
                    pageSize: size,
                    total: res.totalElements,
                });
            } else {
                // Fallback if structure is different (e.g. flat array or 'records')
                // Based on user feedback, UserList uses 'records', checking system.ts for consistency
                // If system.ts uses 'content', we use content. 
                // Note: system.ts was defined to return { content: AppVersionItem[]; totalElements: number }
                setData(res.content || []);
                setPagination({
                    current: page,
                    pageSize: size,
                    total: res.totalElements || 0,
                });
            }
        } catch (error) {
            console.error('Fetch versions failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(pagination.current, pagination.pageSize);
    }, []);

    // Handle Table Pagination Change
    const handleTableChange: TableProps<AppVersionItem>['onChange'] = (newPagination) => {
        fetchData(newPagination.current || 1, newPagination.pageSize || 10);
    };

    // Open Publish Modal
    const showModal = () => {
        setIsModalOpen(true);
        form.resetFields();
        setFileList([]);
    };

    // Handle Publish Submission
    const handlePublish = async () => {
        try {
            // 1. Validate Form Fields
            const values = await form.validateFields();

            // 2. Validate File
            if (fileList.length === 0) {
                message.error('Please upload an installer file (APK/ZIP)');
                return;
            }

            setSubmitting(true);

            // 3. Call Service
            // We must pass the raw File object, usually found in originFileObj
            const fileToUpload = fileList[0].originFileObj as File;

            await publishAppVersion({
                versionNumber: values.versionNumber,
                updateContent: values.updateContent,
                file: fileToUpload,
            });

            message.success('New version published successfully');
            setIsModalOpen(false);
            fetchData(1, pagination.pageSize); // Refresh list to first page
        } catch (error) {
            console.error('Publish failed', error);
            // Error message is handled by request interceptor usually, 
            // but form validation errors are caught here too
        } finally {
            setSubmitting(false);
        }
    };

    // Handle File Change
    const handleFileChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
        // Limit to 1 file
        setFileList(newFileList.slice(-1));
    };

    // Table Columns
    const columns: TableProps<AppVersionItem>['columns'] = [
        {
            title: 'Version',
            dataIndex: 'versionNumber',
            key: 'versionNumber',
            width: 120,
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'Update Content',
            dataIndex: 'updateContent',
            key: 'updateContent',
            ellipsis: true,
        },
        {
            title: 'File Size',
            dataIndex: 'fileSize',
            key: 'fileSize',
            width: 120,
            render: (size) => formatFileSize(size),
        },
        {
            title: 'Publish Time',
            dataIndex: 'createTime',
            key: 'createTime',
            width: 180,
        },
        {
            title: 'Download',
            dataIndex: 'downloadUrl',
            key: 'downloadUrl',
            width: 100,
            render: (url) => (
                <Button
                    type="link"
                    href={url}
                    target="_blank"
                    icon={<CloudUploadOutlined />}
                >
                    Link
                </Button>
            ),
        },
    ];

    return (
        <div className="app-version-page">
            <Card
                title="App Version Management"
                bordered={false}
                extra={
                    <Button type="primary" icon={<CloudUploadOutlined />} onClick={showModal}>
                        Publish New Version
                    </Button>
                }
            >
                {/* Toolbar */}
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => fetchData(pagination.current, pagination.pageSize)}
                    >
                        Refresh
                    </Button>
                </div>

                {/* Data Table */}
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} versions`,
                    }}
                    loading={loading}
                    onChange={handleTableChange}
                />
            </Card>

            {/* Publish Modal */}
            <Modal
                title="Publish New Version"
                open={isModalOpen}
                onOk={handlePublish}
                onCancel={() => setIsModalOpen(false)}
                confirmLoading={submitting}
                okText="Publish"
                cancelText="Cancel"
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="publish_form"
                >
                    <Form.Item
                        name="versionNumber"
                        label="Version Number"
                        rules={[
                            { required: true, message: 'Please input version number (e.g. 1.0.0)' },
                            { pattern: /^[0-9.]+$/, message: 'Only numbers and dots allowed' }
                        ]}
                    >
                        <Input placeholder="e.g. 1.0.0" />
                    </Form.Item>

                    <Form.Item
                        name="updateContent"
                        label="Update Content"
                        rules={[{ required: true, message: 'Please input update description' }]}
                    >
                        <TextArea rows={4} placeholder="Describe what's new in this version..." />
                    </Form.Item>

                    <Form.Item
                        label="Installer File"
                        required
                        tooltip="Supported formats: .apk, .zip, .dmg"
                    >
                        <Upload
                            beforeUpload={() => false} // Prevent auto upload
                            fileList={fileList}
                            onChange={handleFileChange}
                            maxCount={1}
                        >
                            <Button icon={<UploadOutlined />}>Select File</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AppVersion;