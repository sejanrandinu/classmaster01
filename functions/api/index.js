// Helper: Response JSON
const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
});

// Helper: Hash Password using the provided secret
async function hashPassword(password, secret) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + secret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: JWT Sign
async function signJWT(payload, secret) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const stringifiedPayload = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) })); // 7 days
    const signature = btoa(await hashPassword(header + "." + stringifiedPayload, secret));
    return `${header}.${stringifiedPayload}.${signature}`;
}

// Helper: JWT Verify
async function verifyJWT(token, secret) {
    try {
        const [header, payload, signature] = token.split('.');
        if (!header || !payload || !signature) return null;
        const validSignature = btoa(await hashPassword(header + "." + payload, secret));
        if (signature !== validSignature) return null;
        const decodedPayload = JSON.parse(atob(payload));
        if (decodedPayload.exp < Math.floor(Date.now() / 1000)) return null;
        return decodedPayload;
    } catch (e) {
        return null;
    }
}

export async function onRequest(context) {
    const { request, env, params } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');
    const method = request.method;

    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const db = env.DB; 
        const JWT_SECRET = env.JWT_SECRET || "fallback-secret-for-dev";

        if (!db) return json({ error: "Database not bound" }, 500);

        // --- AUTH ROUTES ---

        // REGISTER
        if (path === 'auth/register' && method === 'POST') {
            const { email, password, whatsapp } = await request.json();
            const id = crypto.randomUUID();
            const password_hash = await hashPassword(password, JWT_SECRET);
            
            try {
                await db.prepare("INSERT INTO profiles (id, email, password_hash, whatsapp_number) VALUES (?, ?, ?, ?)")
                    .bind(id, email, password_hash, whatsapp)
                    .run();
                
                const token = await signJWT({ id, email }, JWT_SECRET);
                return json({ message: "Registered", token });
            } catch (e) {
                return json({ error: "Email already exists or DB error" }, 400);
            }
        }

        // LOGIN
        if (path === 'auth/login' && method === 'POST') {
            const { email, password } = await request.json();
            const password_hash = await hashPassword(password, JWT_SECRET);
            
            const user = await db.prepare("SELECT * FROM profiles WHERE email = ? AND password_hash = ?")
                .bind(email, password_hash)
                .first();
            
            if (!user) return json({ error: "Invalid credentials" }, 401);
            
            const token = await signJWT({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
            return json({ message: "Logged in", token, user: { id: user.id, email: user.email, role: user.role } });
        }

        // --- PROTECTED ROUTES ---
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        const payload = token ? await verifyJWT(token, JWT_SECRET) : null;

        if (!payload) return json({ error: "Unauthorized" }, 401);
        const userId = payload.id;

        // PROFILE (ME)
        if (path === 'me' && method === 'GET') {
            const user = await db.prepare("SELECT id, email, whatsapp_number, role, is_approved, bank_name, account_number, account_holder_name FROM profiles WHERE id = ?")
                .bind(userId)
                .first();
            return json(user);
        }

        if (path === 'me' && method === 'POST') {
            const data = await request.json();
            await db.prepare("UPDATE profiles SET whatsapp_number = ?, bank_name = ?, account_number = ?, account_holder_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                .bind(data.whatsapp_number, data.bank_name, data.account_number, data.account_holder_name, userId)
                .run();
            return json({ message: "Profile updated" });
        }

        // STUDENTS
        if (path === 'students' && method === 'GET') {
            const { results } = await db.prepare("SELECT * FROM students WHERE user_id = ?").bind(userId).all();
            return json(results);
        }

        if (path === 'students' && method === 'POST') {
            const data = await request.json();
            await db.prepare("INSERT INTO students (user_id, student_id, name, school, grade, contact, status) VALUES (?, ?, ?, ?, ?, ?, ?)")
                .bind(userId, data.student_id, data.name, data.school, data.grade, data.contact, data.status)
                .run();
            return json({ message: "Student added" });
        }

        if (path.startsWith('students/') && method === 'PUT') {
            const id = path.split('/')[1];
            const data = await request.json();
            await db.prepare("UPDATE students SET name = ?, school = ?, grade = ?, contact = ?, status = ? WHERE id = ? AND user_id = ?")
                .bind(data.name, data.school, data.grade, data.contact, data.status, id, userId)
                .run();
            return json({ message: "Student updated" });
        }

        if (path.startsWith('students/') && method === 'DELETE') {
            const id = path.split('/')[1];
            await db.prepare("DELETE FROM students WHERE id = ? AND user_id = ?").bind(id, userId).run();
            return json({ message: "Student deleted" });
        }

        // STATS
        if (path === 'stats' && method === 'GET') {
            const studentsCount = await db.prepare("SELECT COUNT(*) as count FROM students WHERE user_id = ?").bind(userId).first('count');
            const tutorsCount = await db.prepare("SELECT COUNT(*) as count FROM tutors WHERE user_id = ?").bind(userId).first('count');
            
            // Simplified financials for stats
            const revenue = await db.prepare("SELECT SUM(amount) as total FROM payments WHERE user_id = ?").bind(userId).first('total') || 0;
            const expenses = await db.prepare("SELECT SUM(amount) as total FROM salary_payments WHERE user_id = ?").bind(userId).first('total') || 0;

            return json({
                students_count: studentsCount,
                tutors_count: tutorsCount,
                monthly_revenue: revenue,
                monthly_expenses: expenses,
                remaining_classes_count: 0, // Placeholder
                total_classes_today: 0 // Placeholder
            });
        }

        // ACTIVITIES
        if (path === 'activities' && method === 'GET') {
            const { results } = await db.prepare("SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 10").bind(userId).all();
            return json(results);
        }

        // SCHEDULE
        if (path === 'schedule/today' && method === 'GET') {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const today = days[new Date().getDay()];
            const { results } = await db.prepare("SELECT * FROM classes WHERE user_id = ? AND day = ? AND status = 'Active'").bind(userId, today).all();
            return json(results);
        }

        // TUTORS (Basic support)
        if (path === 'tutors' && method === 'GET') {
            const { results } = await db.prepare("SELECT * FROM tutors WHERE user_id = ?").bind(userId).all();
            return json(results);
        }

        // SUBJECTS
        if (path === 'subjects' && method === 'GET') {
            const { results } = await db.prepare("SELECT * FROM subjects").all();
            return json(results);
        }

        return json({ error: "Not Found", path }, 404);

    } catch (e) {
        return json({ error: e.message }, 500);
    }
}
