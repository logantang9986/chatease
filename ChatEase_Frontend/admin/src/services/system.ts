import request from '../utils/request';

// Interface for App Version Publishing
// Matches: com.dbt.chatease.DTO.AppVersionDTO
export interface AppVersionDTO {
    versionNumber: string;
    updateContent: string;
    file: File;
}

// Interface for Version History Item
export interface AppVersionItem {
    id: number;
    versionNumber: string;
    updateContent: string;
    downloadUrl: string;
    fileSize: number;
    createTime: string;
}

// Interface for Robot Configuration
// Matches: com.dbt.chatease.DTO.RobotConfigDTO
export interface RobotConfigDTO {
    name: string;
    avatar?: string;
    welcomeMessage?: string;
}

// Interface for Broadcast Message DTO (Sending)
export interface BroadcastDTO {
    content: string;
    messageType: number; // 0: Text, 1: Image
    filePath?: string;   // Optional, used for Image type
}

// Interface for Broadcast History Item (Receiving)
// Matches backend SysBroadcast entity
export interface BroadcastItem {
    broadcastId: number;
    senderId: string;
    content: string;
    messageType: number;
    filePath?: string;
    createTime: string;
}

// Interface for Dashboard Statistics
export interface DashboardStatsDTO {
    userCount: number;
    groupCount: number;
}

/**
 * Publish a new App Version
 * Endpoint: POST /admin/app-version/publish
 * Content-Type: multipart/form-data
 */
export const publishAppVersion = (data: AppVersionDTO) => {
    const formData = new FormData();
    formData.append('versionNumber', data.versionNumber);
    formData.append('updateContent', data.updateContent);
    formData.append('file', data.file);

    return request.post('/admin/app-version/publish', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

/**
 * Get version history list
 * Endpoint: GET /admin/app-version/list
 */
export const getVersionList = (page: number, size: number) => {
    return request.get<any, { content: AppVersionItem[]; totalElements: number }>(
        '/admin/app-version/list',
        {
            params: {
                page,
                size,
            },
        }
    );
};

/**
 * Get System Settings (Global Config)
 * Endpoint: GET /admin/settings
 */
export const getSystemSettings = () => {
    return request.get('/admin/settings');
};

/**
 * Get Robot Configuration
 * Endpoint: GET /admin/robot-config
 */
export const getRobotConfig = () => {
    return request.get<any, RobotConfigDTO>('/admin/robot-config');
};

/**
 * Update Robot Configuration
 * Endpoint: PUT /admin/robot-config
 */
export const updateRobotConfig = (data: RobotConfigDTO) => {
    return request.put('/admin/robot-config', data);
};

/**
 * Send System Broadcast
 * Endpoint: POST /admin/broadcast/send
 */
export const sendBroadcast = (data: BroadcastDTO) => {
    return request.post('/admin/broadcast/send', data);
};

/**
 * Get Broadcast History List
 * Endpoint: GET /admin/broadcast/list
 */
export const getBroadcastList = (page: number, size: number) => {
    return request.get<any, { records: BroadcastItem[]; total: number; current: number; size: number }>(
        '/admin/broadcast/list',
        {
            params: {
                page,
                size,
            },
        }
    );
};

/**
 * Get Dashboard Statistics
 * Endpoint: GET /admin/dashboard/stats
 */
export const getDashboardStats = () => {
    return request.get<any, DashboardStatsDTO>('/admin/dashboard/stats');
};

/**
 * General File Upload
 * Endpoint: POST /upload
 * Returns: The static URL of the uploaded file
 */
export const uploadFile = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return request.post<any, string>('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};