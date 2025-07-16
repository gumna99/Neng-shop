import { Response } from 'express';
import { ApiResponse, PaginatedApiResponse, HTTP_STATUS, ApiError } from '../types/api.types';
import { PaginationResult } from '../repositories/BaseRepository';

export class ApiResponseUtil {
  // 成功回應
  static success<T>(
    res: Response,
    data?: T,
    message: string = 'Success',
    statusCode: number = HTTP_STATUS.OK
  ): Response<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path: res.req.originalUrl
    };
    return res.status(statusCode).json(response);   
  }
  // 建立資源成功回應
  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
  ): Response<ApiResponse<T>> {
    return this.success(res, data, message, HTTP_STATUS.CREATED);
  };

  static paginated<T>(
    res: Response,
    paginationResult: PaginationResult<T>,
    message: string = 'Data retrieved successfully'
  ): Response<PaginatedApiResponse<T>> {
    const { data, ...pagination } = paginationResult;

    const response: PaginatedApiResponse<T> = {
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
      path: res.req.originalUrl
    };
    
    return res.status(HTTP_STATUS.OK).json(response);

  }
  // 錯誤回應
  static error(
    res: Response,
    error: string | ApiError,
    message: string = 'An error occurred',
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
  ): Response<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      message,
      error: typeof error === 'string' ? error : error.message,
      timestamp: new Date().toISOString(),
      path: res.req.originalUrl
    };

    //
    if (typeof error === 'object') {
      response.error = {
        code: error.code,
        message: error.message,
        details: error.details,
        field: error.field
      };
    }

    return res.status(statusCode).json(response);
  }
// 常見錯誤回應的快捷方法
  static badRequest(res: Response, message: string = 'Bad request'): Response<ApiResponse> {
    return this.error(res, message, message, HTTP_STATUS.BAD_REQUEST);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): Response<ApiResponse> {
    return this.error(res, message, message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(res: Response, message: string = 'Forbidden'): Response<ApiResponse> {
    return this.error(res, message, message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(res: Response, message: string = 'Resource not found'): Response<ApiResponse> {
    return this.error(res, message, message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(res: Response, message: string = 'Resource conflict'): Response<ApiResponse> {
    return this.error(res, message, message, HTTP_STATUS.CONFLICT);
  }

  static validationError(res: Response, details: any, message: string = 'Validation failed'): Response<ApiResponse> {
    const apiError: ApiError = {
      code: 'VALIDATION_ERROR',
      message,
      details
    };
    return this.error(res, apiError, message, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
}

// 簡短的別名，讓使用更方便
export const ApiResponse = ApiResponseUtil;


