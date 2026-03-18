export interface ResponseModel<T> {
  code: number;
  status: string;
  message: string;
  value: T;
}

export default class ResponseHelper {
  /**
   * Hàm trả về tự tạo
   */
  public static GenerateResponse<T>(
    code: number,
    status: string,
    message: string,
    value: T,
  ): ResponseModel<T> {
    return {
      code: code,
      status: status,
      message: message,
      value: value,
    };
  }
  public static ResponseSuccess<T>(value: T): ResponseModel<T> {
    return {
      code: 200,
      status: 'success',
      message: 'Xử lý thành công',
      value: value,
    };
  }
  public static ResponseConflict<T>(value: T): ResponseModel<T> {
    return {
      code: 409,
      status: 'Conflict',
      message: 'Dữ liệu đã tồn tại',
      value: value,
    };
  }
  public static ResponseNotFound(): ResponseModel<''> {
    return {
      code: 404,
      status: 'NotFound',
      message: 'Không tìm thấy dữ liệu',
      value: '',
    };
  }
  public static ResponseNotFoundString<T>(value: T): ResponseModel<T> {
    return {
      code: 404,
      status: 'NotFound',
      message: 'Không tìm thấy dữ liệu',
      value: value,
    };
  }
  public static ResponseForbidden<T>(value: T): ResponseModel<T> {
    return {
      code: 403,
      status: 'Forbidden',
      message: 'Chưa được cấp phép xử lý',
      value: value,
    };
  }
  public static ResponseNotMember(): ResponseModel<''> {
    return {
      code: 403,
      status: 'Forbidden',
      message: 'Không phải thành viên quản lý',
      value: '',
    };
  }
  public static ResponseServer(): ResponseModel<''> {
    return {
      code: 500,
      status: 'ServerError',
      message: 'Lỗi kết nối',
      value: '',
    };
  }

  public static ResponseException(ex: string): ResponseModel<''> {
    return {
      code: 503,
      status: 'ServerError',
      message: ex,
      value: '',
    };
  }
  public static ResponseUnAuthorize(): ResponseModel<''> {
    return {
      code: 401,
      status: 'UnAuthorize',
      message: 'Từ chối truy cập',
      value: '',
    };
  }
  public static ResponseUnOwner(): ResponseModel<''> {
    return {
      code: 400,
      status: 'UnOwner',
      message: 'Không sở hữu tài liệu',
      value: '',
    };
  }
  public static ResponseStatus(): ResponseModel<''> {
    return {
      code: 400,
      status: 'Bad Request',
      message: 'Trạng thái không hợp lệ',
      value: '',
    };
  }
  public static ResponseData(): ResponseModel<''> {
    return {
      code: 400,
      status: 'Bad Request',
      message: 'Lỗi dữ liệu đầu vào/ Yêu cầu không hợp lệ',
      value: '',
    };
  }
  public static ResponseDataString(message: string): ResponseModel<''> {
    return {
      code: 400,
      status: 'Bad Request',
      message: message,
      value: '',
    };
  }
}
