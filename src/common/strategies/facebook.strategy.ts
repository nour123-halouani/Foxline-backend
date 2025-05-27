import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor() {
        super({
            clientID: process.env.FACEBOOK_CLIENT_ID as string,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
            callbackURL: process.env.FACEBOOK_CALLBACK_URL as string,
            profileFields: ['emails', 'name', 'displayName'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
        const { name, emails } = profile;
        const user = {
            email: emails ? emails[0].value : null,
            name: `${name.givenName} ${name.familyName}`,
            provider: 'facebook',
        };
        done(null, user);
    }
}
