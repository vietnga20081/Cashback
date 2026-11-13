import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import prisma from '../../core/database';
import { cache, CACHE_KEYS } from '../../core/redis';
import { addEmailJob } from '../../core/queue';
import { env } from '../../core/config/env';
import { AppError } from '../../shared/utils/AppError';
import { generateReferralCode } from '../../shared/utils/helpers';


const SALT_ROUNDS = 12;
const OTP_EXPIRE = 10 * 60; // 10 minutes

// ─── Token Generation ─────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
  roleId: number;
  sessionId: string;
}

export function generateAccessToken(payload: JwtPayload): string {
  return (jwt as any).sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES });
}

export function generateRefreshToken(payload: JwtPayload & { family: string }): string {
  return (jwt as any).sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload & { family: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload & { family: string };
}

// ─── Registration ─────────────────────────────────────────────────────────────

export async function registerUser(data: {
  email: string;
  password: string;
  fullName: string;
  referralCode?: string;
}) {
  // Check email exists
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError('Email đã được sử dụng.', 409);

  // Find referrer
  let referredById: string | undefined;
  if (data.referralCode) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: data.referralCode },
    });
    if (referrer) referredById = referrer.id;
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const referralCode = await generateReferralCode();

  // Create user + wallet in transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        referralCode,
        referredById,
        status: 'PENDING_VERIFY',
      },
    });

    // Create wallet
    await tx.wallet.create({ data: { userId: newUser.id } });

    // Build referral chain (F1/F2/F3) using shared service
    if (referredById) {
      const { buildReferralChain } = await import('../referral/referral.service');
      await buildReferralChain(tx, newUser.id, referredById);
    }

    return newUser;
  });

  // Send OTP email
  await sendEmailOtp(user.email, 'VERIFY');

  return user;
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginUser(data: {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
  rememberMe?: boolean;
}) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { role: true },
  });

  if (!user) throw new AppError('Email hoặc mật khẩu không đúng.', 401);

  const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!passwordMatch) throw new AppError('Email hoặc mật khẩu không đúng.', 401);

  if (user.status === 'BANNED') throw new AppError('Tài khoản đã bị khóa.', 403);
  if (user.status === 'PENDING_VERIFY') {
    throw new AppError('Vui lòng xác thực email trước khi đăng nhập.', 403);
  }

  // If 2FA enabled, return partial token
  if (user.twoFactorEnabled) {
    const tempToken = jwt.sign(
      { userId: user.id, type: '2fa_pending' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '5m' }
    );
    return { requires2FA: true, tempToken };
  }

  return createUserSession(user, data);
}

export async function createUserSession(
  user: any,
  opts: { userAgent?: string; ipAddress?: string; rememberMe?: boolean }
) {
  const sessionId = uuidv4();
  const family = uuidv4();

  const refreshExpiry = opts.rememberMe
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    sessionId,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ ...payload, family });

  // Save session + refresh token
  await prisma.$transaction([
    prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        userAgent: opts.userAgent,
        ipAddress: opts.ipAddress,
        expiresAt: refreshExpiry,
      },
    }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        family,
        expiresAt: refreshExpiry,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: opts.ipAddress },
    }),
  ]);

  return { accessToken, refreshToken, user };
}

// ─── Token Rotation ───────────────────────────────────────────────────────────

export async function rotateRefreshToken(oldToken: string) {
  let payload: JwtPayload & { family: string };
  try {
    payload = verifyRefreshToken(oldToken);
  } catch {
    throw new AppError('Refresh token không hợp lệ.', 401);
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: oldToken } });

  if (!stored || stored.isRevoked) {
    // Token reuse detected - revoke all tokens in family
    if (stored) {
      await prisma.refreshToken.updateMany({
        where: { family: stored.family },
        data: { isRevoked: true },
      });
    }
    throw new AppError('Token đã hết hạn hoặc bị thu hồi.', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new AppError('Người dùng không tồn tại.', 401);

  // Revoke old token, issue new
  const newFamily = payload.family;
  const newPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    sessionId: payload.sessionId,
  };

  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken({ ...newPayload, family: newFamily });
  const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.refreshToken.update({ where: { id: stored.id }, data: { isRevoked: true } }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        family: newFamily,
        expiresAt: newExpiry,
      },
    }),
  ]);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

export async function sendEmailOtp(email: string, type: 'VERIFY' | 'RESET' | 'LOGIN') {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const key = CACHE_KEYS.OTP(email, type);

  await cache.set(key, otp, OTP_EXPIRE);

  const templateMap: Record<string, string> = {
    VERIFY: 'email-verify',
    RESET: 'password-reset',
    LOGIN: 'login-otp',
  };

  await addEmailJob({
    to: email,
    templateName: templateMap[type],
    variables: { otp, expireMinutes: '10' },
  });

  return otp; // only return in development
}

export async function verifyEmailOtp(email: string, otp: string, type: 'VERIFY' | 'RESET' | 'LOGIN') {
  const key = CACHE_KEYS.OTP(email, type);
  const stored = await cache.get<string>(key);

  if (!stored || stored !== otp) {
    throw new AppError('Mã OTP không đúng hoặc đã hết hạn.', 400);
  }

  await cache.del(key);

  if (type === 'VERIFY') {
    await prisma.user.update({
      where: { email },
      data: { status: 'ACTIVE', emailVerifiedAt: new Date() },
    });
  }

  return true;
}

// ─── 2FA ──────────────────────────────────────────────────────────────────────

export async function generate2FASecret(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Người dùng không tồn tại.', 404);

  const secret = speakeasy.generateSecret({
    name: `GreenCash (${user.email})`,
    issuer: 'GreenCash',
    length: 32,
  });

  // Store temp secret in cache until verified
  await cache.set(`2fa:setup:${userId}`, secret.base32, 10 * 60);

  const qrCode = await qrcode.toDataURL(secret.otpauth_url!);

  return { secret: secret.base32, qrCode };
}

export async function enable2FA(userId: string, token: string) {
  const tempSecret = await cache.get<string>(`2fa:setup:${userId}`);
  if (!tempSecret) throw new AppError('Phiên thiết lập 2FA đã hết hạn.', 400);

  const valid = speakeasy.totp.verify({
    secret: tempSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!valid) throw new AppError('Mã xác thực không đúng.', 400);

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true, twoFactorSecret: tempSecret },
  });

  await cache.del(`2fa:setup:${userId}`);
  return true;
}

export async function verify2FA(userId: string, token: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.twoFactorSecret) throw new AppError('2FA chưa được kích hoạt.', 400);

  const valid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!valid) throw new AppError('Mã 2FA không đúng.', 401);
  return true;
}
