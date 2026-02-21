// Helper: Response JSON with CORS headers
const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
});

// Helper: Hashing for Internal Use
async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: JWT Sign (Simplified for Workers without external dependencies)
async function signJWT(payload, secret) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, "");
    const stringifiedPayload = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) })).replace(/=/g, "");
    const signature = await hashString(header + "." + stringifiedPayload + secret);
    const b64Signature = btoa(signature).replace(/=/g, "");
    return `${header}.${stringifiedPayload}.${b64Signature}`;
}

// Helper: JWT Verify
async function verifyJWT(token, secret) {
    try {
        if (!token || typeof token !== 'string') return null;
        const [header, payload, signature] = token.split('.');
        if (!header || !payload || !signature) return null;
        
        const expectedSignature = await hashString(header + "." + payload + secret);
        const b64ExpectedSignature = btoa(expectedSignature).replace(/=/g, "");
        
        if (signature !== b64ExpectedSignature) return null;
        
        const decodedPayload = JSON.parse(atob(payload));
        if (decodedPayload.exp < Math.floor(Date.now() / 1000)) return null;
        return decodedPayload;
    } catch (e) {
        console.error('JWT Verify Error:', e);
        return null;
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    // Improved path extraction
    const path = url.pathname.replace(/^\/api\/?/, '');
    const method = request.method;

    // Handle Preflight
    if (method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
        });
    }

    try {
        const db = env.DB; 
        const JWT_SECRET = env.JWT_SECRET || "classmaster-default-secret-2024";

        if (!db) return json({ error: "Database not bound (DB missing in environment)" }, 500);

        // --- AUTH ROUTES ---

        // REGISTER
        if (path === 'auth/register' && method === 'POST') {
            const body = await request.text();
            if (!body) return json({ error: "Empty request body" }, 400);
            const { email, password, whatsapp } = JSON.parse(body);
            
            const id = crypto.randomUUID();
            const password_hash = await hashString(password + JWT_SECRET);
            
            // Auto-approve super admin
            const isSuperAdmin = email.trim().toLowerCase() === 'sejanrandinu01@gmail.com';
            const role = isSuperAdmin ? 'super-admin' : 'pending';
            const approved = isSuperAdmin ? 1 : 0;

            try {
                await db.prepare("INSERT INTO profiles (id, email, password_hash, whatsapp_number, role, is_approved) VALUES (?, ?, ?, ?, ?, ?)")
                    .bind(id, email, password_hash, whatsapp, role, approved)
                    .run();
                
                const token = await signJWT({ id, email, role }, JWT_SECRET);
                return json({ message: "Registered", token, user: { id, email, role } });
            } catch (e) {
                console.error('Registration Error:', e);
                return json({ error: "Account already exists or database error" }, 400);
            }
        }

        // LOGIN
        if (path === 'auth/login' && method === 'POST') {
            const body = await request.text();
            if (!body) return json({ error: "Empty request body" }, 400);
            const { email, password } = JSON.parse(body);
            
            const password_hash = await hashString(password + JWT_SECRET);
            
            const user = await db.prepare("SELECT * FROM profiles WHERE email = ? AND password_hash = ?")
                .bind(email, password_hash)
                .first();
            
            if (!user) return json({ error: "Invalid email or password" }, 401);
            
            const token = await signJWT({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
            return json({ 
                message: "Logged in", 
                token, 
                user: { id: user.id, email: user.email, role: user.role } 
            });
        }

        // --- PROTECTED ROUTES ---
        const authHeader = request.headers.get('Authorization');
        const tokenStr = authHeader?.split(' ')[1];
        const payload = tokenStr ? await verifyJWT(tokenStr, JWT_SECRET) : null;

        if (!payload) return json({ error: "Unauthorized access" }, 401);
        const userId = payload.id;

        // PROFILE (ME)
        if (path === 'me' && method === 'GET') {
            const user = await db.prepare("SELECT id, email, whatsapp_number, role, is_approved, bank_name, account_number, account_holder_name FROM profiles WHERE id = ?")
                .bind(userId)
                .first();
            if (!user) return json({ error: "User not found" }, 404);
            return json(user);
        }

        if (path === 'me' && method === 'POST') {
            const data = await request.json();
            await db.prepare("UPDATE profiles SET whatsapp_number = ?, bank_name = ?, account_number = ?, account_holder_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                .bind(data.whatsapp_number, data.bank_name, data.account_number, data.account_holder_name, userId)
                .run();
            return json({ message: "Profile updated" });
        }

        // --- OTHER ROUTES ---
        if (path === 'students' && method === 'GET') {
            const { results } = await db.prepare("SELECT * FROM students WHERE user_id = ?").bind(userId).all();
            return json(results || []);
        }

        if (path === 'tutors' && method === 'GET') {
            const { results } = await db.prepare("SELECT * FROM tutors WHERE user_id = ?").bind(userId).all();
            return json(results || []);
        }

        if (path === 'classes' && method === 'GET') {
            const { results } = await db.prepare("SELECT * FROM classes WHERE user_id = ?").bind(userId).all();
            return json(results || []);
        }

        if (path === 'profiles' && method === 'GET') {
             const { results } = await db.prepare("SELECT * FROM profiles ORDER BY created_at DESC").all();
             return json(results || []);
        }

        if (path.startsWith('profiles/') && path.endsWith('/approve') && method === 'PUT') {
            const id = path.split('/')[1];
            const { is_approved } = await request.json();
            await db.prepare("UPDATE profiles SET is_approved = ?, role = ? WHERE id = ?")
                .bind(is_approved ? 1 : 0, is_approved ? 'admin' : 'pending', id)
                .run();
            return json({ message: "Status updated" });
        }

        return json({ error: "Endpoint not found", path }, 404);

    } catch (e) {
        console.error('Worker error:', e);
        return json({ error: "Internal Server Error", message: e.message }, 500);
    }
}
