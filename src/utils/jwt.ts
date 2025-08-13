import jwt, { SignOptions } from "jsonwebtoken";
import { JwtPayload } from "../types/user.types";

export class JwtUtil {
  private static readonly ACCESS_TOKEN_SECRET =
    process.env.JWT_ACCESS_SECRET || "access-secret-key";
  private static readonly REFRESH_TOKEN_SECRET =
    process.env.JWT_REFRESH_SECRET || "refresh-secret-key";
  private static readonly ACCESS_TOKEN_EXPIRES_IN =
    process.env.JWT_ACCESS_EXPIRES_IN || "15m";
  private static readonly REFRESH_TOKEN_EXPIRES_IN =
    process.env.JWT_REFRESH_EXPIRES_IN || "7d";

  // 更強大的時間解析工具
  private static parseTimeToSeconds(timeString: string): number {
    const timeValue = parseInt(timeString.slice(0, -1)); // 取得數字部分
    const unit = timeString.slice(-1); // 取得單位（最後一個字元）

    switch (unit) {
      case "s":
        return timeValue; // 秒
      case "m":
        return timeValue * 60; // 分鐘
      case "h":
        return timeValue * 60 * 60; // 小時
      case "d":
        return timeValue * 24 * 60 * 60; // 天
      case "w":
        return timeValue * 7 * 24 * 60 * 60; // 週
      default:
        console.warn(`未知的時間單位: ${unit}，預設為秒`);
        return parseInt(timeString) || 3600; // 預設 1 小時
    }
  }
  // 生成 Access Token
  static generateAccessToken(payload: JwtPayload): string {
    const options: SignOptions = {
      expiresIn: this.parseTimeToSeconds(this.ACCESS_TOKEN_EXPIRES_IN),
      issuer: "neng-shop",
      audience: "neng-shop-users",
    };
    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, options);
  }
  // 生成 Refresh Token
  static generateRefreshToken(
    payload: Pick<JwtPayload, "id" | "email">
  ): string {
    const options: SignOptions = {
      expiresIn: this.parseTimeToSeconds(this.REFRESH_TOKEN_EXPIRES_IN),
      issuer: "neng-shop",
      audience: "neng-shop-users",
    };
    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, options);
  }
  // 驗證 Access Token
  static verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
        issuer: "neng-shop",
        audience: "neng-shop-users",
      }) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("TOKEN_EXPIRED");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("TOKEN_INVALID");
      }
      throw new Error("TOKEN_VERIFICATION_FAILED");
    }
  }
  // 驗證 Refresh Token
  static verifyRefreshToken(token: string): Pick<JwtPayload, "id" | "email"> {
    try {
      return jwt.verify(token, this.REFRESH_TOKEN_SECRET, {
        issuer: "neng-shop",
        audience: "neng-shop-users",
      }) as Pick<JwtPayload, "id" | "email">;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("REFRESH_TOKEN_EXPIRED");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("REFRESH_TOKEN_INVALID");
      }
      throw new Error("REFRESH_TOKEN_VERIFICATION_FAILED");
    }
  }
  // 從 token 中解析資料（不驗證）
  static decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
  // 生成 token 對
  static generateTokenPair(user: { id: number; email: string; role: string }) {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role as any,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken({
        id: user.id,
        email: user.email,
      }),
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    };
  }
}
