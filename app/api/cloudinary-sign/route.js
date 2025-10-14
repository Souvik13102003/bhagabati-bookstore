// app/api/cloudinary-sign/route.js
import { v2 as cloudinary } from 'cloudinary';

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

export async function POST(request) {
    try {
        const { folder = 'books', resource_type = 'auto' } = await request.json();

        const timestamp = Math.floor(Date.now() / 1000);

        // ✅ Only sign parameters required by Cloudinary
        const paramsToSign = {
            timestamp,
            folder,
        };

        const signature = cloudinary.utils.api_sign_request(paramsToSign, CLOUDINARY_API_SECRET);

        return new Response(
            JSON.stringify({
                cloudName: CLOUDINARY_CLOUD_NAME,
                apiKey: CLOUDINARY_API_KEY,
                timestamp,
                folder,
                resource_type, // you can return this for client use, but don't sign it
                signature,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (err) {
        console.error('Cloudinary sign error:', err);
        return new Response(
            JSON.stringify({ error: 'Failed to generate signature' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
