import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';

const SALT_ROUNDS = 10;

class AuthService {
  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  // Compare password with hash
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Generate access token
  generateAccessToken(payload) {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    });
  }

  // Generate refresh token
  generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiresIn
    });
  }

  // Generate both tokens
  generateTokens(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      store_id: user.store_id
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken({ id: user.id })
    };
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token expired');
      }
      throw new UnauthorizedError('Invalid token');
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwtRefreshSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Refresh token expired');
      }
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  // Extract token from Authorization header
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    return authHeader.substring(7);
  }
}

export default new AuthService();