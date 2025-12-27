// ================= AUTH SERVICE (FINAL + FIXED FOR YOUR CONFIG) =================

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { randomUUID } from 'crypto';
import { User, UserRole, UserStatus } from '../../database/entities/user.entity';
import { UserAddress } from '../../database/entities/user-address.entity';
import { UserBusiness } from '../../database/entities/user-business.entity';

import { LoginDto } from './dto/login.dto';
import { SuperAdminLoginDto } from './dto/super-admin-login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';

import {
  BCRYPT_SALT_ROUNDS,
  DEFAULT_ADDRESS_COUNTRY,
  PASSWORD_RESET_TOKEN_BYTES,
  OtpPurpose,
} from '../../common/constants/auth.constants';
import { ProfileDto } from './dto/profile.dto';
import { OtpService } from './services/otp.service';
import { MessagingService } from './services/messaging.service';
import * as dayjs from 'dayjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(UserAddress)
    private addressRepo: Repository<UserAddress>,

    @InjectRepository(UserBusiness)
    private businessRepo: Repository<UserBusiness>,

    @InjectDataSource()
    private dataSource: DataSource,

    private jwt: JwtService,
    private config: ConfigService,
    private otpService: OtpService,
    private messagingService: MessagingService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const { emailOrPhone, password } = dto;

    // 1. Determine if emailOrPhone is email or phone
    const isEmail = emailOrPhone.includes('@');
    const isPhone = /^\+91[6-9]\d{9}$/.test(emailOrPhone);

    if (!isEmail && !isPhone) {
      throw new BadRequestException('Please provide a valid email address or phone number');
    }

    // 2. Find user by email or phone + business relation
    const whereCondition = isEmail ? { email: emailOrPhone } : { phone: emailOrPhone };
    const user = await this.userRepo.findOne({
      where: whereCondition,
      relations: ['business'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    // 3. Compare passwords
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    // 4. Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account inactive or banned');
    }

    // 5. Update last login
    const now = new Date();
    await this.userRepo.update(user.id, { lastLogin: now });
    user.lastLogin = now;

    // 6. Generate tokens
    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // 7. Map business entity → DTO
    const businessDto = user.business
      ? {
          businessName: user.business.businessName,
          businessType: user.business.businessType,
          businessSegment: user.business.businessSegment,
          businessDescription: user.business.businessDescription,
          gstNumber: user.business.gstNumber,
          websiteUrl: user.business.websiteUrl,
          businessLogo: user.business.businessLogo,
        }
      : undefined;

    // 8. Map User → ProfileDto (safe mapping)
    const profile = new ProfileDto({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profileImage: user.profileImage,
      business: businessDto,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    // 9. Final response
    return {
      ...tokens,
      user: profile,
    };
  }

  // ========================================================
  // SUPER ADMIN LOGIN
  // ========================================================
  async superAdminLogin(dto: SuperAdminLoginDto): Promise<AuthResponseDto> {
    const { email, password } = dto;
    // 1. Find admin or super admin by email
    const user = await this.userRepo.findOne({
      where: [
        { email, role: UserRole.SUPER_ADMIN },
        { email, role: UserRole.ADMIN },
      ],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Compare passwords
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account inactive or banned');
    }

    // 4. Update last login
    const now = new Date();
    await this.userRepo.update(user.id, { lastLogin: now });
    user.lastLogin = now;

    // 5. Generate tokens
    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // 6. Map User → ProfileDto
    const profile = new ProfileDto({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    // 7. Final response
    return {
      ...tokens,
      user: profile,
    };
  }

  // ========================================================
  // REFRESH TOKEN
  // ========================================================
  async refreshToken(userId: string, refreshToken: string): Promise<AuthResponseDto> {
    const user = await this.validateUserWithRefreshToken(userId);
    // 1. Verify refresh token hash
    const valid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // 2. Check expiry
    if (user.refreshTokenExpires < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    // 3. Generate new tokens
    const tokens = await this.generateTokens(user);
    // 4. Rotate refresh token (IMPORTANT)
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    // 5. Return new tokens & profile
    return {
      ...tokens,
      user: await this.getProfile(user.id),
    };
  }

  // ========================================================
  // LOGOUT
  // ========================================================
  async logout(userId: string) {
    await this.userRepo.update(userId, {
      refreshToken: null,
      refreshTokenExpires: null,
      lastLogin: new Date(), // optional tracking
    });
  }
  // ========================================================
  // GET PROFILE
  // ========================================================
  async getProfile(userId: string): Promise<ProfileDto> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['addresses', 'business'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const businessDto = user.business
      ? {
          businessName: user.business.businessName,
          businessType: user.business.businessType,
          businessSegment: user.business.businessSegment,
          businessDescription: user.business.businessDescription,
          gstNumber: user.business.gstNumber,
          websiteUrl: user.business.websiteUrl,
          businessLogo: user.business.businessLogo,
        }
      : undefined;

    return new ProfileDto({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      role: user.role,
      status: user.status,
      profileImage: user.profileImage,
      addresses: user.addresses,
      business: businessDto,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  // ========================================================
  // UPDATE PROFILE
  // ========================================================
  // ========================================================
  // UPDATE PROFILE (SAFE VERSION)
  // ========================================================
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // --------------------------------------------------------
    // PHONE VALIDATION
    // --------------------------------------------------------
    if (dto.phone) {
      const phoneExists = await this.userRepo.findOne({
        where: { phone: dto.phone },
      });

      if (phoneExists && phoneExists.id !== userId) {
        throw new ConflictException('Phone already in use');
      }

      // Phone changed → reset verification
      if (dto.phone !== user.phone) {
        user.phoneVerified = false;
      }

      user.phone = dto.phone;
    }

    // --------------------------------------------------------
    // UPDATE ALLOWED FIELDS
    // --------------------------------------------------------
    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    if (dto.profileImage) user.profileImage = dto.profileImage;

    // --------------------------------------------------------
    // SAVE UPDATED USER
    // --------------------------------------------------------
    await this.userRepo.save(user);

    // Return full profile with relations
    return this.getProfile(userId);
  }

  // ========================================================
  // CHANGE PASSWORD
  // ========================================================
  async changePassword(userId: string, current: string, next: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(current, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password incorrect');

    if (await bcrypt.compare(next, user.passwordHash))
      throw new BadRequestException('New password must be different');

    const hashed = await bcrypt.hash(next, BCRYPT_SALT_ROUNDS);

    await this.userRepo.update(userId, { passwordHash: hashed });
  }

  // ========================================================
  // TOKEN GENERATION
  // ========================================================
  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: randomUUID(),
    };

    return {
      accessToken: await this.jwt.signAsync(payload, {
        secret: this.config.get('app.jwt.secret'),
        expiresIn: this.config.get('app.jwt.expiresIn'),
      }),
      refreshToken: await this.jwt.signAsync(payload, {
        secret: this.config.get('app.jwt.refreshSecret'),
        expiresIn: this.config.get('app.jwt.refreshExpiresIn'),
      }),
      expiresIn: this.config.get('app.jwt.expiresIn'),
    };
  }

  // ========================================================
  // UPDATE REFRESH TOKEN
  // ========================================================
  async updateRefreshToken(userId: string, rt: string) {
    const hashed = await bcrypt.hash(rt, BCRYPT_SALT_ROUNDS);

    // MUST load entity with primary key
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id'], // only need ID for save()
    });

    user.refreshToken = hashed;
    user.refreshTokenExpires = dayjs().add(7, 'days').toDate();

    await this.userRepo.save(user);
  }

  private calculateExpiry(ttl: string) {
    const expires = new Date();

    if (ttl.endsWith('d')) expires.setDate(expires.getDate() + parseInt(ttl));
    else if (ttl.endsWith('h')) expires.setHours(expires.getHours() + parseInt(ttl));
    else if (ttl.endsWith('m')) expires.setMinutes(expires.getMinutes() + parseInt(ttl));

    return expires;
  }

  // ========================================================
  // VALIDATE USER (USED BY STRATEGIES)
  // ========================================================
  async validateUserById(userId: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id: userId, status: UserStatus.ACTIVE },
      select: ['id', 'email', 'role', 'refreshToken', 'refreshTokenExpires'],
    });
  }
  // ========================================================
  // OTP-BASED SIGNUP FLOW
  // ========================================================
  async sendSignupOtp(phone: string): Promise<void> {
    // Check if user already exists BEFORE sending OTP
    const existingUser = await this.userRepo.findOne({ where: { phone } });

    if (existingUser) {
      throw new ConflictException('User with this phone number already exists');
    }

    // User doesn't exist, proceed to send OTP
    await this.messagingService.sendOtp(phone, OtpPurpose.SIGNUP);
  }

  async verifySignupOtp(
    phone: string,
    otp: string,
  ): Promise<{ sessionToken: string; userExists: boolean }> {
    const isValid = await this.otpService.verifyOtp(phone, otp, OtpPurpose.SIGNUP);

    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Double-check if user already exists (should not happen if sendSignupOtp was called correctly)
    const existingUser = await this.userRepo.findOne({ where: { phone } });

    if (existingUser) {
      return { sessionToken: null, userExists: true };
    }

    // Create session token for new user registration
    // Session token is bound to the phone number used for OTP verification
    const sessionToken = await this.otpService.createOtpSession(phone, OtpPurpose.SIGNUP);

    return { sessionToken, userExists: false };
  }

  async completeRegistration(
    sessionToken: string,
    dto: Omit<CompleteRegistrationDto, 'sessionToken'>,
  ): Promise<AuthResponseDto> {
    // Verify session token and get the phone number it's associated with
    const phoneFromSession = await this.otpService.verifyOtpSession(
      sessionToken,
      OtpPurpose.SIGNUP,
    );

    if (!phoneFromSession) {
      throw new BadRequestException('Invalid or expired session token');
    }

    // Session token is now consumed (deleted), so it can't be reused
    // The phone number from the session is the one that was verified via OTP

    const { email, password, firstName, lastName, address, business } = dto;

    // Check if email already exists
    const emailExists = await this.userRepo.findOne({ where: { email } });
    if (emailExists) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if phone already exists (should not happen if flow was followed correctly)
    const phoneExists = await this.userRepo.findOne({ where: { phone: phoneFromSession } });
    if (phoneExists) {
      throw new ConflictException('User with this phone number already exists');
    }

    // Use the phone number from the session token (the verified one)
    // This ensures the session token is correctly associated with the phone number
    const phone = phoneFromSession;

    const query = this.dataSource.createQueryRunner();
    await query.connect();
    await query.startTransaction();

    try {
      const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

      const user = this.userRepo.create({
        email,
        passwordHash,
        firstName,
        lastName: lastName || null,
        phone,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        phoneVerified: true, // Phone is verified via OTP
      });

      const saved = await query.manager.save(User, user);

      if (address) {
        await query.manager.save(
          UserAddress,
          this.addressRepo.create({
            userId: saved.id,
            addressType: address.addressType || 'default',
            street: address.street || null,
            city: address.city || null,
            state: address.state || null,
            zipcode: address.zipcode || null,
            country: address.country || DEFAULT_ADDRESS_COUNTRY,
          }),
        );
      }

      if (business) {
        await query.manager.save(
          UserBusiness,
          this.businessRepo.create({
            userId: saved.id,
            businessName: business.businessName || null,
            businessType: business.businessType || null,
            businessSegment: business.businessSegment || null,
            businessDescription: business.businessDescription || null,
            gstNumber: business.gstNumber || null,
            websiteUrl: business.websiteUrl || null,
            businessLogo: business.businessLogo || null,
          }),
        );
      }

      await query.commitTransaction();

      const tokens = await this.generateTokens(saved);
      await this.updateRefreshToken(saved.id, tokens.refreshToken);

      const profile = new ProfileDto({
        id: saved.id,
        email: saved.email,
        firstName: saved.firstName,
        lastName: saved.lastName,
        phone: saved.phone,
        role: saved.role,
        status: saved.status,
        profileImage: saved.profileImage,
        phoneVerified: saved.phoneVerified,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
        business: business
          ? {
              businessName: business.businessName,
              businessType: business.businessType,
              businessSegment: business.businessSegment,
              businessDescription: business.businessDescription,
              gstNumber: business.gstNumber,
              websiteUrl: business.websiteUrl,
              businessLogo: business.businessLogo,
            }
          : undefined,
      });

      return {
        ...tokens,
        user: profile,
      };
    } catch (err) {
      await query.rollbackTransaction();
      throw err;
    } finally {
      await query.release();
    }
  }

  // ========================================================
  // OTP-BASED FORGOT PASSWORD FLOW
  // ========================================================
  async sendResetPasswordOtp(phone: string): Promise<void> {
    // Validate user exists BEFORE sending OTP
    const user = await this.userRepo.findOne({ where: { phone } });
    if (!user) {
      throw new NotFoundException('User with this phone number not found');
    }

    // User exists, proceed to send OTP
    await this.messagingService.sendOtp(phone, OtpPurpose.RESET_PASSWORD);
  }

  async verifyResetPasswordOtp(phone: string, otp: string): Promise<string> {
    const isValid = await this.otpService.verifyOtp(phone, otp, OtpPurpose.RESET_PASSWORD);

    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Verify user exists
    const user = await this.userRepo.findOne({ where: { phone } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create session token for password reset
    const sessionToken = await this.otpService.createOtpSession(phone, OtpPurpose.RESET_PASSWORD);

    return sessionToken;
  }

  async resetPasswordWithOtp(
    phone: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> {
    // Verify passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Find user
    const user = await this.userRepo.findOne({ where: { phone } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if new password is same as old
    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      throw new BadRequestException('New password must be different from old password');
    }

    // Hash and update password
    const newHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.userRepo.update(user.id, {
      passwordHash: newHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  async validateUserWithRefreshToken(userId: string) {
    return this.userRepo.findOne({
      where: { id: userId, status: UserStatus.ACTIVE },
      select: ['id', 'email', 'role', 'refreshToken', 'refreshTokenExpires'],
    });
  }
}
