import request from '../utils/request';

// Interface for Admin Login Data Transfer Object
// Matches: com.dbt.chatease.DTO.AdminLoginDTO
export interface AdminLoginDTO {
  username: string;
  password: string;
}

// Interface for Login Result
// Matches the Map<String, Object> returned by AdminController.login
export interface LoginResult {
  token: string;
  adminName: string;
  role: string;
}

/**
 * Admin Login API
 * Endpoint: POST /admin/login
 * @param data - Username and password
 * @returns Promise containing the login result (token, adminName, role)
 */
export const login = (data: AdminLoginDTO) => {
  return request.post<any, LoginResult>('/admin/login', data);
};

/**
 * Logout function
 * Clears local storage
 */
export const logout = () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_info');
};

