import bcrypt from 'bcrypt';

export class PasswordUtils {
  private static readonly SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
  /**
   * 加密密碼
   */

  static async hash(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error) {
      throw new Error('密碼加密失效')
    }
  }

  /**
   * 驗證密碼
   */
  static async compare(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('密碼驗證失效')
    }
  }
  /**
   * 驗證密碼強度
   */
    static validateStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('密碼至少需要 8 個字元');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('密碼需要包含至少一個小寫字母');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('密碼需要包含至少一個大寫字母');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('密碼需要包含至少一個數字');
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('密碼需要包含至少一個特殊字元 (@$!%*?&)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  /**
   * 生成隨機密碼
   */
  static generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%'
    let password = '';

    // 確保包含每種字符類型
    password += 'a'; // 小寫
    password += 'A'; // 大寫
    password += '1'; // 數字
    password += '@'; // 特殊字元
    // 填充剩餘長度
    for (let i = 4; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // 打亂順序
    return password.split('').sort(() => Math.random() - 0.5).join('');      
  }
}
