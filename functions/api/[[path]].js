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

// Helper: JWT Sign (Simplified for Workers)
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
        return null;
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/?/, '');
    const method = request.method;

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

        if (!db) return json({ error: "Database not bound" }, 500);

        // --- AUTH ROUTES ---
        if (path === 'auth/register' && method === 'POST') {
            const { email, password, whatsapp } = await request.json();
            const id = crypto.randomUUID();
            const password_hash = await hashString(password + JWT_SECRET);
            const isSuperAdmin = email.trim().toLowerCase() === 'sejanrandinu01@gmail.com';
            const role = isSuperAdmin ? 'super-admin' : 'pending';
            const approved = isSuperAdmin ? 1 : 0;

            try {
                await db.prepare("INSERT INTO profiles (id, email, password_hash, whatsapp_number, role, is_approved) VALUES (?, ?, ?, ?, ?, ?)")
                    .bind(id, email, password_hash, whatsapp, role, approved).run();
                const token = await signJWT({ id, email, role }, JWT_SECRET);
                return json({ message: "Registered", token, user: { id, email, role } });
            } catch (e) {
                return json({ error: "Account already exists" }, 400);
            }
        }

        if (path === 'auth/login' && method === 'POST') {
            const { email, password } = await request.json();
            const password_hash = await hashString(password + JWT_SECRET);
            const user = await db.prepare("SELECT * FROM profiles WHERE email = ? AND password_hash = ?").bind(email, password_hash).first();
            if (!user) return json({ error: "Invalid credentials" }, 401);
            const token = await signJWT({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
            return json({ message: "Logged in", token, user: { id: user.id, email: user.email, role: user.role } });
        }

        // --- PROTECTED ROUTES ---
        const authHeader = request.headers.get('Authorization');
        const tokenStr = authHeader?.split(' ')[1];
        const payload = tokenStr ? await verifyJWT(tokenStr, JWT_SECRET) : null;
        if (!payload) return json({ error: "Unauthorized" }, 401);
        const userId = payload.id;

        const logActivity = async (type, desc) => {
            await db.prepare("INSERT INTO messages (user_id, content, recipient_type, status) VALUES (?, ?, ?, ?)").bind(userId, desc, type, 'Log').run();
        };

        // PROFILE
        if (path === 'me' && method === 'GET') {
            const user = await db.prepare("SELECT id, email, whatsapp_number, role, is_approved, bank_name, account_number, account_holder_name FROM profiles WHERE id = ?").bind(userId).first();
            return json(user);
        }
        if (path === 'me' && method === 'POST') {
            const data = await request.json();
            await db.prepare("UPDATE profiles SET whatsapp_number = ?, bank_name = ?, account_number = ?, account_holder_name = ? WHERE id = ?").bind(data.whatsapp_number, data.bank_name, data.account_number, data.account_holder_name, userId).run();
            return json({ message: "Updated" });
        }

        // STUDENTS
        if (path === 'students' && method === 'GET') {
            const grade = url.searchParams.get('grade');
            const status = url.searchParams.get('status');
            let q = "SELECT * FROM students WHERE user_id = ?";
            const p = [userId];
            if (grade) { q += " AND grade = ?"; p.push(grade); }
            if (status) { q += " AND status = ?"; p.push(status); }
            const { results } = await db.prepare(q + " ORDER BY created_at DESC").bind(...p).all();
            return json(results || []);
        }
        if (path.startsWith('students/by-id/')) {
            const sid = path.split('/')[2];
            const s = await db.prepare("SELECT * FROM students WHERE user_id = ? AND student_id = ?").bind(userId, sid).first();
            return json(s);
        }
        if (path === 'students' && method === 'POST') {
            const d = await request.json();
            await db.prepare("INSERT INTO students (user_id, student_id, name, school, grade, contact, status, subjects_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(userId, d.student_id, d.name, d.school, d.grade, d.contact, d.status || 'Active', JSON.stringify(d.subjects || [])).run();
            await logActivity('student', `Added ${d.name}`);
            return json({ message: "Added" });
        }
        if (path.startsWith('students/') && method === 'PUT') {
            const id = path.split('/')[1];
            const d = await request.json();
            await db.prepare("UPDATE students SET name = ?, school = ?, grade = ?, contact = ?, status = ?, subjects_json = ? WHERE id = ? AND user_id = ?")
                .bind(d.name, d.school, d.grade, d.contact, d.status, JSON.stringify(d.subjects || []), id, userId).run();
            return json({ message: "Updated" });
        }
        if (path.startsWith('students/') && method === 'DELETE') {
            const id = path.split('/')[1];
            await db.prepare("DELETE FROM students WHERE id = ? AND user_id = ?").bind(id, userId).run();
            return json({ message: "Deleted" });
        }

        // TUTORS
        if (path === 'tutors' && method === 'GET') {
            const { results } = await db.prepare("SELECT * FROM tutors WHERE user_id = ?").bind(userId).all();
            return json(results.map(t => ({ ...t, grades: JSON.parse(t.grades_json || '[]') })));
        }
        if (path === 'tutors' && method === 'POST') {
            const d = await request.json();
            await db.prepare("INSERT INTO tutors (user_id, name, subject, email, phone, grades_json, bank_name, bank_account_name, bank_account_number, bank_branch) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(userId, d.name, d.subject, d.email, d.phone, JSON.stringify(d.grades || []), d.bank_name, d.bank_account_name, d.bank_account_number, d.bank_branch).run();
            return json({ message: "Added" });
        }
        if (path.startsWith('tutors/') && method === 'PUT') {
            const id = path.split('/')[1];
            const d = await request.json();
            await db.prepare("UPDATE tutors SET name = ?, subject = ?, email = ?, phone = ?, grades_json = ?, bank_name = ?, bank_account_name = ?, bank_account_number = ?, bank_branch = ? WHERE id = ? AND user_id = ?")
                .bind(d.name, d.subject, d.email, d.phone, JSON.stringify(d.grades || []), d.bank_name, d.bank_account_name, d.bank_account_number, d.bank_branch, id, userId).run();
            return json({ message: "Updated" });
        }
        if (path.startsWith('tutors/') && method === 'DELETE') {
            const id = path.split('/')[1];
            await db.prepare("DELETE FROM tutors WHERE id = ? AND user_id = ?").bind(id, userId).run();
            return json({ message: "Deleted" });
        }

        // CLASSES
        if (path === 'classes' && method === 'GET') {
            const grade = url.searchParams.get('grade');
            const status = url.searchParams.get('status');
            let q = "SELECT *, name as class_name, tutor_name as tutor, subject_name as subject FROM classes WHERE user_id = ?";
            const p = [userId];
            if (grade) { q += " AND grade = ?"; p.push(grade); }
            if (status) { q += " AND status = ?"; p.push(status); }
            const { results } = await db.prepare(q).bind(...p).all();
            return json(results || []);
        }
        if (path === 'classes' && method === 'POST') {
            const d = await request.json();
            await db.prepare("INSERT INTO classes (user_id, name, tutor_name, subject_name, grade, day, class_date, start_time, end_time, fee, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(userId, d.class_name, d.tutor, d.subject, d.grade, d.day, d.class_date, d.start_time, d.end_time, d.fee, d.status || 'Active').run();
            return json({ message: "Added" });
        }
        if (path.startsWith('classes/') && method === 'PUT') {
            const id = path.split('/')[1];
            const d = await request.json();
            await db.prepare("UPDATE classes SET name = ?, tutor_name = ?, subject_name = ?, grade = ?, day = ?, class_date = ?, start_time = ?, end_time = ?, fee = ?, status = ? WHERE id = ? AND user_id = ?")
                .bind(d.class_name, d.tutor, d.subject, d.grade, d.day, d.class_date, d.start_time, d.end_time, d.fee, d.status, id, userId).run();
            return json({ message: "Updated" });
        }
        if (path.startsWith('classes/') && method === 'DELETE') {
            const id = path.split('/')[1];
            await db.prepare("DELETE FROM classes WHERE id = ? AND user_id = ?").bind(id, userId).run();
            return json({ message: "Deleted" });
        }

        // PAYMENTS
        if (path === 'payments' && method === 'GET') {
            const sid = url.searchParams.get('student_id');
            let q = "SELECT p.*, s.name as student_name, c.name as class_name FROM payments p LEFT JOIN students s ON p.student_id = s.id LEFT JOIN classes c ON p.class_id = c.id WHERE p.user_id = ?";
            const p = [userId];
            if (sid) { q += " AND p.student_id = ?"; p.push(sid); }
            const { results } = await db.prepare(q + " ORDER BY p.payment_date DESC").bind(...p).all();
            return json(results || []);
        }
        if (path === 'payments' && method === 'POST') {
            const d = await request.json();
            await db.prepare("INSERT INTO payments (user_id, student_id, class_id, amount, month, payment_date, payment_method, receipt_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(userId, d.student_id, d.class_id, d.amount, d.month, d.payment_date, d.payment_method, d.receipt_no).run();
            await logActivity('payment', `Collected ${d.amount}`);
            return json({ message: "Recorded" });
        }

        // ATTENDANCE
        if (path === 'attendance' && method === 'GET') {
            const sid = url.searchParams.get('student_id');
            const date = url.searchParams.get('date');
            let q = "SELECT * FROM attendance WHERE user_id = ?";
            const p = [userId];
            if (sid) { q += " AND student_id = ?"; p.push(sid); }
            if (date) { q += " AND date = ?"; p.push(date); }
            const { results } = await db.prepare(q).bind(...p).all();
            return json(results || []);
        }
        if (path === 'attendance/upsert' && method === 'POST') {
            const { records } = await request.json();
            for (const r of records) {
                await db.prepare("INSERT INTO attendance (user_id, student_id, class_id, date, status) VALUES (?, ?, ?, ?, ?) ON CONFLICT(student_id, class_id, date) DO UPDATE SET status = excluded.status")
                    .bind(userId, r.student_id, r.class_id, r.date, r.status).run();
            }
            return json({ message: "Saved" });
        }

        // STAFF
        if (path === 'staff' && method === 'GET') {
            const { results } = await db.prepare("SELECT * FROM staff WHERE user_id = ?").bind(userId).all();
            const staff = [];
            for (const s of results) {
                const { results: payments } = await db.prepare("SELECT * FROM salary_payments WHERE staff_id = ? AND user_id = ? ORDER BY payment_date DESC LIMIT 5").bind(s.id, userId).all();
                staff.push({ ...s, salary_payments: payments || [] });
            }
            return json(staff);
        }
        if (path === 'staff' && method === 'POST') {
            const d = await request.json();
            await db.prepare("INSERT INTO staff (user_id, name, role, whatsapp_number, salary, status) VALUES (?, ?, ?, ?, ?, ?)").bind(userId, d.name, d.role, d.whatsapp_number, d.salary, d.status || 'Active').run();
            return json({ message: "Added" });
        }
        if (path.startsWith('staff/') && method === 'PUT') {
            const id = path.split('/')[1];
            const d = await request.json();
            await db.prepare("UPDATE staff SET name = ?, role = ?, whatsapp_number = ?, salary = ?, status = ? WHERE id = ? AND user_id = ?").bind(d.name, d.role, d.whatsapp_number, d.salary, d.status, id, userId).run();
            return json({ message: "Updated" });
        }
        if (path.startsWith('staff/') && method === 'DELETE') {
            const id = path.split('/')[1];
            await db.prepare("DELETE FROM staff WHERE id = ? AND user_id = ?").bind(id, userId).run();
            return json({ message: "Deleted" });
        }

        // SALARY PAYMENTS
        if (path === 'salary_payments' && method === 'POST') {
            const d = await request.json();
            await db.prepare("INSERT INTO salary_payments (user_id, staff_id, amount, payment_date, notes) VALUES (?, ?, ?, ?, ?)").bind(userId, d.staff_id, d.amount, d.payment_date, d.notes).run();
            return json({ message: "Recorded" });
        }

        // ROLES
        if (path === 'roles' && method === 'GET') {
            const { results } = await db.prepare("SELECT * FROM roles WHERE user_id = ?").bind(userId).all();
            return json(results.map(r => ({ ...r, permissions: JSON.parse(r.permissions_json || '[]') })));
        }
        if (path === 'roles' && method === 'POST') {
            const d = await request.json();
            await db.prepare("INSERT INTO roles (user_id, name, description, color, permissions_json) VALUES (?, ?, ?, ?, ?)").bind(userId, d.name, d.description, d.color, JSON.stringify(d.permissions || [])).run();
            return json({ message: "Created" });
        }
        if (path.startsWith('roles/') && method === 'DELETE') {
            const id = path.split('/')[1];
            await db.prepare("DELETE FROM roles WHERE id = ? AND user_id = ?").bind(id, userId).run();
            return json({ message: "Deleted" });
        }

        // STATS
        if (path === 'stats' && method === 'GET') {
            const students = await db.prepare("SELECT COUNT(*) as count FROM students WHERE user_id = ?").bind(userId).first('count') || 0;
            const tutors = await db.prepare("SELECT COUNT(*) as count FROM tutors WHERE user_id = ?").bind(userId).first('count') || 0;
            const classes = await db.prepare("SELECT COUNT(*) as count FROM classes WHERE user_id = ?").bind(userId).first('count') || 0;
            const revenue = await db.prepare("SELECT SUM(amount) as sum FROM payments WHERE user_id = ? AND strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now')").bind(userId).first('sum') || 0;
            const expenses = await db.prepare("SELECT SUM(amount) as sum FROM salary_payments WHERE user_id = ? AND strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now')").bind(userId).first('sum') || 0;
            return json({ students_count: students, tutors_count: tutors, total_classes: classes, monthly_revenue: revenue, monthly_expenses: expenses });
        }

        // SCHEDULE
        if (path === 'schedule/today') {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const today = days[new Date().getDay()];
            const { results } = await db.prepare("SELECT *, name as class_name, tutor_name as tutor, subject_name as subject FROM classes WHERE user_id = ? AND day = ?").bind(userId, today).all();
            return json(results || []);
        }

        // SUBJECTS
        if (path === 'subjects' && method === 'GET') {
            const { results } = await db.prepare("SELECT * FROM subjects WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all();
            return json(results || []);
        }
        if (path === 'subjects' && method === 'POST') {
            const d = await request.json();
            await db.prepare("INSERT INTO subjects (user_id, name, code, description) VALUES (?, ?, ?, ?)").bind(userId, d.name, d.code, d.description).run();
            return json({ message: "Added" });
        }
        if (path.startsWith('subjects/') && method === 'DELETE') {
            const id = path.split('/')[1];
            await db.prepare("DELETE FROM subjects WHERE id = ? AND user_id = ?").bind(id, userId).run();
            return json({ message: "Deleted" });
        }

        // ACTIVITIES
        if (path === 'activities' && method === 'GET') {
            const { results } = await db.prepare("SELECT content as description, recipient_type as type, created_at FROM messages WHERE user_id = ? AND status = 'Log' ORDER BY created_at DESC LIMIT 10").bind(userId).all();
            return json(results || []);
        }

        // ADMIN PROFILES
        if (path === 'profiles' && method === 'GET') {
            const { results } = await db.prepare("SELECT id, email, role, is_approved, created_at FROM profiles ORDER BY created_at DESC").all();
            return json(results || []);
        }
        if (path.startsWith('profiles/') && path.endsWith('/approve') && method === 'PUT') {
            const id = path.split('/')[1];
            const { is_approved } = await request.json();
            await db.prepare("UPDATE profiles SET is_approved = ?, role = ? WHERE id = ?").bind(is_approved ? 1 : 0, is_approved ? 'admin' : 'pending', id).run();
            return json({ message: "Approved" });
        }

        return json({ error: "Not Found", path }, 404);

    } catch (e) {
        console.error('Worker error:', e);
        return json({ error: "Server Error", message: e.message }, 500);
    }
}
