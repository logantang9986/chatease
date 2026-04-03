import request from '../utils/request';

// Interface for User List Item (Based on typical UserInfo entity fields)
export interface UserItem {
    userId: string;
    nickName: string; // Updated from 'username' to match backend 'nickName'
    email: string;
    avatar?: string;
    status: number; // 0: Banned, 1: Normal
    createTime: string;
}

// Interface for User List Response (Pagination)
export interface UserListResult {
    records: UserItem[];
    total: number;
    current: number;
    size: number;
}

// Interface for updating user status
// Matches: com.dbt.chatease.DTO.UserStatusDTO
export interface UserStatusDTO {
    userId: string;
    status: number;
}

/**
 * Get paginated user list
 * Endpoint: GET /admin/users
 */
export const getUserList = (page: number, size: number, keyword?: string) => {
    return request.get<any, UserListResult>('/admin/users', {
        params: {
            page,
            size,
            keyword,
        },
    });
};

/**
 * Update user status (Ban/Unban)
 * Endpoint: PUT /admin/user/status
 */
export const updateUserStatus = (data: UserStatusDTO) => {
    return request.put('/admin/user/status', data);
};

/**
 * Force logout a user
 * Endpoint: POST /admin/user/force-logout
 * Note: The backend controller expects 'userId' as a query parameter or form parameter, not a JSON body.
 */
export const forceLogout = (userId: string) => {
    return request.post('/admin/user/force-logout', null, {
        params: {
            userId,
        },
    });
};