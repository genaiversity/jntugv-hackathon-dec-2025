const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                return done(null, user);
            }

            // Check if user exists with same email
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                // Link google account
                user.googleId = profile.id;
                await user.save();
                return done(null, user);
            }

            // Create new user
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                // No password for social login
            });

            await user.save();
            done(null, user);
        } catch (err) {
            console.error('Google Auth Error:', err);
            done(err, null);
        }
    }
    ));
}

// Only configure Facebook OAuth if credentials are provided
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "/api/auth/facebook/callback",
        profileFields: ['id', 'displayName', 'emails']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ facebookId: profile.id });

            if (user) {
                return done(null, user);
            }

            if (profile.emails && profile.emails.length > 0) {
                user = await User.findOne({ email: profile.emails[0].value });
                if (user) {
                    user.facebookId = profile.id;
                    await user.save();
                    return done(null, user);
                }
            }

            user = new User({
                name: profile.displayName,
                email: profile.emails ? profile.emails[0].value : `fb_${profile.id}@example.com`, // Fallback if no email
                facebookId: profile.id
            });

            await user.save();
            done(null, user);
        } catch (err) {
            console.error('Facebook Auth Error:', err);
            done(err, null);
        }
    }
    ));
}

module.exports = passport;
