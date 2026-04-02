import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
      scope: ['email', 'profile'],
      state: false,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;

    const googleUser = {
      googleId: id,
      email: emails?.[0]?.value ?? '',
      fullName: displayName ?? '',
      avatar: photos?.[0]?.value ?? undefined,
    };

    const user = await this.authService.findOrCreateGoogleUser(googleUser);
    done(null, user);
  }
}
