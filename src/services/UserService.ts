import { Repository } from "typeorm";
import { AppDataSource } from "../config/typeorm";
import { User } from "../entities/User.entity";
import { CreateUserInput, UserResponse, UpdateUserInput, LoginInput } from "../types/user.types";
import { PasswordUtils } from "../utils/password";

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }
  async createUser(userData: CreateUserInput): Promise<UserResponse> {
    // 檢查email 不能重複
    const existingUserByEmail = await this.userRepository.findOne({
      where: { email: userData.email } 
    });

    if (existingUserByEmail) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }
    // 檢查username 不能重複
    const existingUserByName = await this.userRepository.findOne({
      where: { username: userData.username } 
    });

    if (existingUserByName) {
      throw new Error("NAME_ALREADY_EXISTS");
    }
    // 密碼加密
    const hashedPassword = await PasswordUtils.hash(userData.password);

    const user = this.userRepository.create({
      email: userData.email,
      username: userData.username,
      password: hashedPassword,
      fullname: userData.fullName,
      role: userData.role || 'buyer' // 預設角色
    })
    const savedUser = await this.userRepository.save(user);

    return this.formatUserResponse(savedUser);  
  }

  private formatUserResponse(user: User): UserResponse {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponse;
  }

  async findById(id: number): Promise<UserResponse | null> {
    const user = await this.userRepository.findOne({
      where: { id, isDeleted: false }
    });
    if (!user) {
      return null;
    }
    return this.formatUserResponse(user)
  }
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email, isDeleted: false }
    });
  }
  
  async validateCredentials(email: string, password: string): Promise<UserResponse | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }
    const isValidPassword = await PasswordUtils.compare(password, user.password)
    if (!isValidPassword) {
      return null;
    }
    return this.formatUserResponse(user);
  }

  async updateUser(id: number, updateData: UpdateUserInput): Promise<UserResponse> {
    const existingUser = await this.userRepository.findOne({ where: { id } })
    if (!existingUser) {
      throw new Error("USER_NOT_FOUND");
    }

    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await this.userRepository.findOne({ where: { email: updateData.email }})
      if (emailExists) {
        throw new Error("EMAIL_ALREADY_EXISTS")
      }
    }

    if (updateData.username && updateData.username !== existingUser.username) {
      const usernameExists = await this.userRepository.findOne({ where: { username: updateData.username }})
      if (usernameExists) {
        throw new Error("USERNAME_ALREADY_EXISTS")
      }
    }
    Object.assign(existingUser, updateData);
    const updatedUser = await this.userRepository.save(existingUser)
    return this.formatUserResponse(updatedUser)
  }

  async updatePassword(id: number, newPassword: string): Promise<void> {
    const user =  await this.userRepository.findOne({ where: { id } })
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
    const hashedPassword = await PasswordUtils.hash(newPassword);
    user.password = hashedPassword
    await this.userRepository.update(id, { password: hashedPassword})

  }

  async deleteUser(id: number): Promise<void> {
    const user =  await this.userRepository.findOne({ where: { id } })
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
    if (user.isDeleted) {
      throw new Error('USER_ALREADY_DELETED')
    }
    await this.userRepository.update(id, { isDeleted: true})
  }
}