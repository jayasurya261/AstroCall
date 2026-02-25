import { SignJWT } from 'jose';

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;
const API_KEY = import.meta.env.VITE_LIVEKIT_API_KEY;
const API_SECRET = import.meta.env.VITE_LIVEKIT_API_SECRET;

/**
 * Generate a LiveKit access token for a given room and identity.
 * Uses the `jose` library (browser-compatible JWT) to create the token client-side.
 * NOTE: For production, move this to a secure backend/cloud function.
 */
export async function generateLiveKitToken(roomName, identity, callType = 'video') {
    const secret = new TextEncoder().encode(API_SECRET);

    const now = Math.floor(Date.now() / 1000);

    const token = await new SignJWT({
        iss: API_KEY,
        sub: identity,
        nbf: now,
        exp: now + 3600, // 1 hour expiry
        jti: identity + '-' + Date.now(),
        video: {
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canPublishData: true,
            canSubscribe: true,
        },
    })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);

    return token;
}

export function getLiveKitUrl() {
    return LIVEKIT_URL;
}
