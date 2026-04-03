import request from '../utils/request';

// Interface for Group List Item (Based on typical GroupInfo entity fields)
export interface GroupItem {
  groupId: string;
  groupName: string;
  groupOwnerId: string; // Used for disbanding logic
  groupAvatar?: string; // Updated from 'avatar' to match backend 'groupAvatar'
  createTime: string;
}

// Interface for Group List Response (Pagination)
export interface GroupListResult {
  records: GroupItem[];
  total: number;
  current: number;
  size: number;
}

/**
 * Get paginated group list
 * Endpoint: GET /admin/groups
 */
export const getGroupList = (page: number, size: number, keyword?: string) => {
  return request.get<any, GroupListResult>('/admin/groups', {
    params: {
      page,
      size,
      keyword,
    },
  });
};

/**
 * Disband a group
 * Endpoint: POST /admin/group/disband
 * Note: The backend controller expects 'groupId' as a query parameter.
 */
export const disbandGroup = (groupId: string) => {
  return request.post('/admin/group/disband', null, {
    params: {
      groupId,
    },
  });
};