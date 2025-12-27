import { ROUTES } from '../../common/constants';
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';
import { SuperAdminLoginDto } from './dto/super-admin-login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { OtpPurpose } from '../../common/constants/auth.constants';

import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimit } from '../../security/decorators/rate-limit.decorator';
import { ResponseUtil } from '../../common/utils/response.util';

@ApiTags('WebApp - Authentication')
@Controller(ROUTES.WEBAPP.BASE)
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // -----------------------------------------------------
  // OTP-BASED SIGNUP FLOW
  // -----------------------------------------------------
  @Public()
  @Post('signup/send-otp')
  @RateLimit({ limit: 5, window: 60 * 15 })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP for signup' })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 409, description: 'User with this phone number already exists' })
  async sendSignupOtp(@Body() dto: SendOtpDto) {
    await this.authService.sendSignupOtp(dto.phone);
    return ResponseUtil.success(null, 'OTP sent successfully to your WhatsApp');
  }

  @Public()
  @Post('signup/verify-otp')
  @RateLimit({ limit: 10, window: 60 * 15 })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP for signup' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifySignupOtp(@Body() dto: VerifyOtpDto) {
    const result = await this.authService.verifySignupOtp(dto.phone, dto.otp);

    if (result.userExists) {
      return ResponseUtil.error(null, 'User already registered with this phone number');
    }

    return ResponseUtil.success(
      { sessionToken: result.sessionToken },
      'OTP verified successfully. Please complete your registration.',
    );
  }

  @Public()
  @Post('signup/complete')
  @RateLimit({ limit: 5, window: 60 * 15 })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Complete registration after OTP verification' })
  @ApiBody({ type: CompleteRegistrationDto })
  @ApiResponse({ status: 201, description: 'User successfully registered', type: AuthResponseDto })
  async completeRegistration(@Body() dto: CompleteRegistrationDto) {
    const { sessionToken, ...registrationData } = dto;
    const result = await this.authService.completeRegistration(sessionToken, registrationData);
    return ResponseUtil.success(result, 'User registered successfully');
  }

  // -----------------------------------------------------
  // LOGIN
  // -----------------------------------------------------
  @Public()
  @Post('login')
  @RateLimit({ limit: 10, window: 60 * 15 })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'User successfully logged in', type: AuthResponseDto })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return ResponseUtil.success(result, 'User logged in successfully');
  }

  @Public()
  @Post('admin/login')
  @RateLimit({ limit: 10, window: 60 * 15 })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login admin or super admin with email and password' })
  @ApiBody({ type: SuperAdminLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Admin successfully logged in',
    type: AuthResponseDto,
  })
  async superAdminLogin(@Body() loginDto: SuperAdminLoginDto) {
    const result = await this.authService.superAdminLogin(loginDto);
    return ResponseUtil.success(result, 'Admin logged in successfully');
  }

  // -----------------------------------------------------
  // REFRESH TOKEN
  // -----------------------------------------------------
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('refresh-token') // ✔️ Correct for custom header
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refresh(@CurrentUser() user: any) {
    const result = await this.authService.refreshToken(user.id, user.token);
    return ResponseUtil.success(result, 'Token refreshed successfully');
  }

  // -----------------------------------------------------
  // LOGOUT
  // -----------------------------------------------------
  @UseGuards(JwtRefreshGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  async logout(@CurrentUser() user: any) {
    await this.authService.logout(user.id);
    return ResponseUtil.success(null, 'User logged out successfully');
  }

  // -----------------------------------------------------
  // OTP-BASED FORGOT PASSWORD FLOW
  // -----------------------------------------------------
  @Public()
  @Post('forgot-password/send-otp')
  @RateLimit({ limit: 5, window: 60 * 10 })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP for password reset' })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 404, description: 'User with this phone number not found' })
  async sendResetPasswordOtp(@Body() dto: SendOtpDto) {
    await this.authService.sendResetPasswordOtp(dto.phone);
    return ResponseUtil.success(null, 'OTP sent successfully to your WhatsApp');
  }

  @Public()
  @Post('forgot-password/verify-otp')
  @RateLimit({ limit: 10, window: 60 * 10 })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP for password reset' })
  @ApiBody({ type: VerifyResetOtpDto })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyResetPasswordOtp(@Body() dto: VerifyResetOtpDto) {
    const sessionToken = await this.authService.verifyResetPasswordOtp(dto.phone, dto.otp);
    return ResponseUtil.success(
      { sessionToken },
      'OTP verified successfully. You can now reset your password.',
    );
  }

  @Public()
  @Post('forgot-password/resend-otp')
  @RateLimit({ limit: 3, window: 60 * 10 })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP for signup or password reset' })
  @ApiBody({ type: ResendOtpDto })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  @ApiResponse({
    status: 404,
    description: 'User with this phone number not found (for password reset)',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this phone number already exists (for signup)',
  })
  async resendOtp(@Body() dto: ResendOtpDto) {
    if (dto.purpose === OtpPurpose.SIGNUP) {
      await this.authService.sendSignupOtp(dto.phone);
    } else {
      await this.authService.sendResetPasswordOtp(dto.phone);
    }
    return ResponseUtil.success(null, 'OTP resent successfully');
  }

  @Public()
  @Post('reset-password')
  @RateLimit({ limit: 5, window: 60 * 10 })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password after OTP verification' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPasswordWithOtp(dto.phone, dto.newPassword, dto.confirmPassword);
    return ResponseUtil.success(null, 'Password has been successfully reset');
  }
}
