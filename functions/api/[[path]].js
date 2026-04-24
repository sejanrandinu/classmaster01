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

// Helper: JWT Sign
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
    const fullPath = url.pathname.replace(/^\/api\/?/, '');
    const pathParts = fullPath.split('/').filter(p => p !== '');
    const path = pathParts[0];
    const subPath = pathParts[1];
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

        // --- AUTH ---
        if (path === 'auth' && subPath === 'register' && method === 'POST') {
            const { email, password, whatsapp } = await request.json();
            const id = crypto.randomUUID();
            const password_hash = await hashString(password + JWT_SECRET);
            const isSuperAdmin = email.trim().toLowerCase() === 'sejanrandinu01@gmail.com';
            const role = isSuperAdmin ? 'super-admin' : 'pending';
            const approved = isSuperAdmin ? 1 : 0;
            await db.prepare("INSERT INTO profiles (id, email, password_hash, whatsapp_number, role, is_approved) VALUES (?, ?, ?, ?, ?, ?)")
                .bind(id, email, password_hash, whatsapp, role, approved).run();
            const token = await signJWT({ id, email, role }, JWT_SECRET);
            return json({ message: "Registered", token, user: { id, email, role } });
        }

        if (path === 'auth' && subPath === 'login' && method === 'POST') {
            const { email, password } = await request.json();
            const password_hash = await hashString(password + JWT_SECRET);
            const user = await db.prepare("SELECT * FROM profiles WHERE email = ? AND password_hash = ?").bind(email, password_hash).first();
            if (!user) return json({ error: "Invalid credentials" }, 401);
            const token = await signJWT({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
            return json({ message: "Logged in", token, user: { id: user.id, email: user.email, role: user.role } });
        }

        if (path === 'auth' && subPath === 'reset-password' && method === 'POST') {
            return json({ message: "Password reset email sent" });
        }

        // --- PROTECTED ---
        const authHeader = request.headers.get('Authorization');
        const tokenStr = authHeader?.split(' ')[1];
        const payload = tokenStr ? await verifyJWT(tokenStr, JWT_SECRET) : null;
        if (!payload) return json({ error: "Unauthorized" }, 401);
        const userId = payload.id;

        const logActivity = async (type, desc) => {
            try {
                await db.prepare("INSERT INTO messages (user_id, content, recipient_type, status) VALUES (?, ?, ?, ?)").bind(userId, desc, type, 'Log').run();
            } catch (e) {
                console.error('Log error:', e);
            }
        };

        // ME
        if (path === 'me') {
            if (method === 'GET') {
                const user = await db.prepare("SELECT id, email, whatsapp_number, role, is_approved, bank_name, account_number, account_holder_name FROM profiles WHERE id = ?").bind(userId).first();
                return json(user);
            }
            if (method === 'POST') {
                const d = await request.json();
                await db.prepare("UPDATE profiles SET whatsapp_number = ?, bank_name = ?, account_number = ?, account_holder_name = ? WHERE id = ?").bind(d.whatsapp_number, d.bank_name, d.account_number, d.account_holder_name, userId).run();
                return json({ message: "Updated" });
            }
            if (method === 'PUT' && subPath === 'password') {
                const { password } = await request.json();
                const password_hash = await hashString(password + JWT_SECRET);
                await db.prepare("UPDATE profiles SET password_hash = ? WHERE id = ?").bind(password_hash, userId).run();
                return json({ message: "Password updated" });
            }
        }

        // STUDENTS
        if (path === 'students') {
            if (method === 'GET') {
                if (subPath === 'by-id') {
                    const sid = pathParts[2];
                    const s = await db.prepare("SELECT * FROM students WHERE user_id = ? AND student_id = ?").bind(userId, sid).first();
                    return json(s);
                }
                const grade = url.searchParams.get('grade');
                const status = url.searchParams.get('status');
                let q = "SELECT * FROM students WHERE user_id = ?";
                const p = [userId];
                if (grade) { q += " AND grade = ?"; p.push(grade); }
                if (status) { q += " AND status = ?"; p.push(status); }
                const { results } = await db.prepare(q + " ORDER BY name ASC").bind(...p).all();
                const mapped = (results || []).map(s => {
                    let subjects = [];
                    try { subjects = JSON.parse(s.subjects_json || '[]'); } catch (e) { subjects = []; }
                    return { ...s, subjects };
                });
                return json(mapped);
            }
            if (method === 'POST') {
                const d = await request.json();
                await db.prepare("INSERT INTO students (user_id, student_id, name, school, grade, contact, status, subjects_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                    .bind(userId, d.student_id, d.name, d.school, d.grade, d.contact, d.status || 'Active', JSON.stringify(d.subjects || [])).run();
                await logActivity('student', `Added student ${d.name}`);
                return json({ message: "Added" });
            }
            if (method === 'PUT' && subPath) {
                const d = await request.json();
                await db.prepare("UPDATE students SET student_id = ?, name = ?, school = ?, grade = ?, contact = ?, status = ?, subjects_json = ? WHERE id = ? AND user_id = ?")
                    .bind(d.student_id, d.name, d.school, d.grade, d.contact, d.status, JSON.stringify(d.subjects || []), subPath, userId).run();
                return json({ message: "Updated" });
            }
            if (method === 'DELETE' && subPath) {
                await db.prepare("DELETE FROM students WHERE id = ? AND user_id = ?").bind(subPath, userId).run();
                return json({ message: "Deleted" });
            }
        }

        // TUTORS
        if (path === 'tutors') {
            if (method === 'GET') {
                const { results } = await db.prepare("SELECT * FROM tutors WHERE user_id = ? ORDER BY name ASC").bind(userId).all();
                const mapped = (results || []).map(t => {
                    let grades = [];
                    try { grades = JSON.parse(t.grades_json || '[]'); } catch (e) { grades = []; }
                    return { ...t, grades };
                });
                return json(mapped);
            }
            if (method === 'POST') {
                const d = await request.json();
                await db.prepare("INSERT INTO tutors (user_id, name, subject, email, phone, grades_json, bank_name, bank_account_name, bank_account_number, bank_branch) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                    .bind(userId, d.name, d.subject, d.email, d.phone, JSON.stringify(d.grades || []), d.bank_name, d.bank_account_name, d.bank_account_number, d.bank_branch).run();
                return json({ message: "Added" });
            }
            if (method === 'PUT' && subPath) {
                const d = await request.json();
                await db.prepare("UPDATE tutors SET name = ?, subject = ?, email = ?, phone = ?, grades_json = ?, bank_name = ?, bank_account_name = ?, bank_account_number = ?, bank_branch = ? WHERE id = ? AND user_id = ?")
                    .bind(d.name, d.subject, d.email, d.phone, JSON.stringify(d.grades || []), d.bank_name, d.bank_account_name, d.bank_account_number, d.bank_branch, subPath, userId).run();
                return json({ message: "Updated" });
            }
            if (method === 'DELETE' && subPath) {
                await db.prepare("DELETE FROM tutors WHERE id = ? AND user_id = ?").bind(subPath, userId).run();
                return json({ message: "Deleted" });
            }
        }

        // CLASSES
        if (path === 'classes') {
            if (method === 'GET') {
                const grade = url.searchParams.get('grade');
                const status = url.searchParams.get('status');
                
                // Colombo Time for checking past classes
                const now = new Date(Date.now() + 5.5 * 3600000);
                const todayDate = now.toISOString().split('T')[0];

                let q = "SELECT id, name, name as class_name, tutor_name, tutor_name as tutor, subject_name, subject_name as subject, grade, day, class_date, start_time, end_time, fee, status FROM classes WHERE user_id = ?";
                const p = [userId];
                if (grade) { q += " AND grade = ?"; p.push(grade); }
                if (status) { q += " AND status = ?"; p.push(status); }
                
                // Optional: Auto-deactivate past sessions in memory or just filter them
                // For now, let's just make sure we return them but maybe mark them as 'Expired' if past date
                const { results } = await db.prepare(q + " ORDER BY created_at DESC").bind(...p).all();
                const mapped = (results || []).map(c => {
                    if (c.class_date && c.class_date < todayDate && c.status === 'Active') {
                        return { ...c, status: 'Completed' };
                    }
                    return c;
                });
                return json(mapped);
            }
            if (method === 'POST') {
                const d = await request.json();
                await db.prepare("INSERT INTO classes (user_id, name, tutor_name, subject_name, grade, day, class_date, start_time, end_time, fee, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                    .bind(userId, d.class_name, d.tutor, d.subject, d.grade, d.day, d.class_date || null, d.start_time, d.end_time, d.fee, d.status || 'Active').run();
                await logActivity('class', `Scheduled class ${d.class_name}`);
                return json({ message: "Added" });
            }
            if (method === 'PUT' && subPath) {
                const d = await request.json();
                await db.prepare("UPDATE classes SET name = ?, tutor_name = ?, subject_name = ?, grade = ?, day = ?, class_date = ?, start_time = ?, end_time = ?, fee = ?, status = ? WHERE id = ? AND user_id = ?")
                    .bind(d.class_name, d.tutor, d.subject, d.grade, d.day, d.class_date || null, d.start_time, d.end_time, d.fee, d.status, subPath, userId).run();
                return json({ message: "Updated" });
            }
            if (method === 'DELETE' && subPath) {
                await db.prepare("DELETE FROM classes WHERE id = ? AND user_id = ?").bind(subPath, userId).run();
                return json({ message: "Deleted" });
            }
        }

        // REMINDERS
        if (path === 'reminders' && subPath === 'unpaid') {
            const classId = url.searchParams.get('class_id');
            const month = url.searchParams.get('month');
            if (!classId || !month) return json({ error: "Missing parameters" }, 400);

            const cls = await db.prepare("SELECT * FROM classes WHERE id = ? AND user_id = ?").bind(classId, userId).first();
            if (!cls) return json({ error: "Class not found" }, 404);

            // Get all active students for this grade
            const { results: students } = await db.prepare("SELECT id, name, contact, subjects_json FROM students WHERE user_id = ? AND grade = ? AND status = 'Active'")
                .bind(userId, cls.grade).all();
            
            // Get all students who have paid for this class and month
            const { results: paidStudents } = await db.prepare("SELECT student_id FROM payments WHERE user_id = ? AND class_id = ? AND month = ?")
                .bind(userId, classId, month).all();
            
            const paidIds = new Set(paidStudents.map(p => p.student_id));
            const unpaid = students.filter(s => {
                // Check if already paid
                if (paidIds.has(s.id)) return false;
                
                // Check if student takes this subject
                try {
                    const subs = JSON.parse(s.subjects_json || '[]');
                    return subs.includes(cls.subject_name);
                } catch (e) {
                    return false;
                }
            });

            return json(unpaid);
        }

        // PAYMENTS
        if (path === 'payments') {
            // ... (rest of the existing payments code)

            if (method === 'POST') {
                try {
                    const d = await request.json();
                    
                    // Check for duplicate payment
                    const existing = await db.prepare("SELECT id FROM payments WHERE student_id = ? AND class_id = ? AND month = ? AND user_id = ?")
                        .bind(d.student_id, d.class_id, d.month, userId).first();
                    
                    if (existing) {
                        return json({ error: "Duplicate Payment", details: `A payment for ${d.month} already exists for this student and class.` }, 400);
                    }

                    await db.prepare("INSERT INTO payments (user_id, student_id, class_id, amount, month, payment_date, payment_method, receipt_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                        .bind(userId, d.student_id, d.class_id, Number(d.amount), d.month, d.payment_date || new Date().toISOString().split('T')[0], d.payment_method, d.receipt_no).run();
                    await logActivity('payment', `Collected fee Rs. ${d.amount}`);
                    return json({ message: "Recorded" });
                } catch (e) {
                    console.error('Payment Error:', e.message);
                    return json({ error: `Database Error: ${e.message}` }, 500);
                }
            }
            if (method === 'DELETE' && subPath) {
                await db.prepare("DELETE FROM payments WHERE id = ? AND user_id = ?").bind(subPath, userId).run();
                return json({ message: "Deleted" });
            }
        }

        // ATTENDANCE
        if (path === 'attendance') {
            if (method === 'GET') {
                const sid = url.searchParams.get('student_id');
                const cid = url.searchParams.get('class_id');
                const date = url.searchParams.get('date');
                const start = url.searchParams.get('start');
                const end = url.searchParams.get('end');

                let q = `
                    SELECT 
                        a.*, 
                        s.name as student_name, 
                        s.student_id as student_id_str, 
                        c.name as class_name 
                    FROM attendance a 
                    LEFT JOIN students s ON a.student_id = s.id 
                    LEFT JOIN classes c ON a.class_id = c.id 
                    WHERE a.user_id = ?
                `;
                const p = [userId];
                if (sid) { q += " AND a.student_id = ?"; p.push(sid); }
                if (cid) { q += " AND a.class_id = ?"; p.push(cid); }
                if (date) { q += " AND a.date = ?"; p.push(date); }
                if (start) { q += " AND a.date >= ?"; p.push(start); }
                if (end) { q += " AND a.date <= ?"; p.push(end); }
                
                const { results } = await db.prepare(q + " ORDER BY a.date DESC, a.created_at DESC").bind(...p).all();
                return json(results || []);
            }
            if (subPath === 'upsert' && method === 'POST') {
                const { records } = await request.json();
                for (const r of records) {
                    await db.prepare("INSERT INTO attendance (user_id, student_id, class_id, date, status) VALUES (?, ?, ?, ?, ?) ON CONFLICT(student_id, class_id, date) DO UPDATE SET status = excluded.status")
                        .bind(userId, r.student_id, r.class_id, r.date, r.status).run();
                }
                return json({ message: "Saved" });
            }
            if (method === 'DELETE' && subPath) {
                await db.prepare("DELETE FROM attendance WHERE id = ? AND user_id = ?").bind(subPath, userId).run();
                return json({ message: "Deleted" });
            }
        }

        // STAFF
        if (path === 'staff') {
            if (method === 'GET') {
                if (pathParts[2] === 'payments') {
                    const { results } = await db.prepare("SELECT * FROM salary_payments WHERE staff_id = ? AND user_id = ? ORDER BY payment_date DESC").bind(subPath, userId).all();
                    return json(results || []);
                }
                const { results } = await db.prepare("SELECT * FROM staff WHERE user_id = ?").bind(userId).all();
                const staff = [];
                for (const s of results) {
                    const { results: payments } = await db.prepare("SELECT * FROM salary_payments WHERE staff_id = ? AND user_id = ? ORDER BY payment_date DESC LIMIT 5").bind(s.id, userId).all();
                    staff.push({ ...s, salary_payments: payments || [] });
                }
                return json(staff);
            }
            if (method === 'POST') {
                const d = await request.json();
                await db.prepare("INSERT INTO staff (user_id, name, role, whatsapp_number, salary, status) VALUES (?, ?, ?, ?, ?, ?)").bind(userId, d.name, d.role, d.whatsapp_number, d.salary, d.status || 'Active').run();
                return json({ message: "Added" });
            }
            if (method === 'PUT' && subPath) {
                const d = await request.json();
                await db.prepare("UPDATE staff SET name = ?, role = ?, whatsapp_number = ?, salary = ?, status = ? WHERE id = ? AND user_id = ?").bind(d.name, d.role, d.whatsapp_number, d.salary, d.status, subPath, userId).run();
                return json({ message: "Updated" });
            }
            if (method === 'DELETE' && subPath) {
                await db.prepare("DELETE FROM staff WHERE id = ? AND user_id = ?").bind(subPath, userId).run();
                return json({ message: "Deleted" });
            }
        }

        // SALARY PAYMENTS
        if (path === 'salary_payments' && method === 'POST') {
            const d = await request.json();
            await db.prepare("INSERT INTO salary_payments (user_id, staff_id, amount, payment_date, notes) VALUES (?, ?, ?, ?, ?)").bind(userId, d.staff_id, d.amount, d.payment_date, d.notes).run();
            await logActivity('salary', `Paid salary Rs. ${d.amount}`);
            return json({ message: "Recorded" });
        }

        // ROLES
        if (path === 'roles') {
            if (method === 'GET') {
                const { results } = await db.prepare("SELECT * FROM roles WHERE user_id = ?").bind(userId).all();
                return json((results || []).map(r => {
                    let perms = [];
                    try { perms = JSON.parse(r.permissions_json || '[]'); } catch(e) { perms = []; }
                    return { ...r, permissions: perms };
                }));
            }
            if (method === 'POST') {
                const d = await request.json();
                await db.prepare("INSERT INTO roles (user_id, name, description, color, permissions_json) VALUES (?, ?, ?, ?, ?)").bind(userId, d.name, d.description, d.color, JSON.stringify(d.permissions || [])).run();
                return json({ message: "Created" });
            }
            if (method === 'DELETE' && subPath) {
                await db.prepare("DELETE FROM roles WHERE id = ? AND user_id = ?").bind(subPath, userId).run();
                return json({ message: "Deleted" });
            }
        }

        // STATS
        if (path === 'stats' && method === 'GET') {
            const students = await db.prepare("SELECT COUNT(*) as count FROM students WHERE user_id = ?").bind(userId).first('count') || 0;
            const tutors = await db.prepare("SELECT COUNT(*) as count FROM tutors WHERE user_id = ?").bind(userId).first('count') || 0;
            const classes = await db.prepare("SELECT COUNT(*) as count FROM classes WHERE user_id = ?").bind(userId).first('count') || 0;
            
            // Adjusted for Colombo Time (+5:30)
            const colomboNow = new Date(Date.now() + 5.5 * 3600000);
            const monthPrefix = colomboNow.toISOString().substring(0, 7); // YYYY-MM

            const revenue = await db.prepare("SELECT SUM(amount) as sum FROM payments WHERE user_id = ? AND payment_date LIKE ?").bind(userId, `${monthPrefix}%`).first('sum') || 0;
            const expenses = await db.prepare("SELECT SUM(amount) as sum FROM salary_payments WHERE user_id = ? AND payment_date LIKE ?").bind(userId, `${monthPrefix}%`).first('sum') || 0;
            
            return json({ 
                students_count: Number(students), 
                tutors_count: Number(tutors), 
                total_classes: Number(classes), 
                monthly_revenue: Number(revenue), 
                monthly_expenses: Number(expenses) 
            });
        }

        // SCHEDULE
        if (path === 'schedule' && subPath === 'today') {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            // Colombo Time Offset (+5:30)
            const now = new Date(Date.now() + 5.5 * 3600000);
            const todayDay = days[now.getUTCDay()];
            const todayDate = now.toISOString().split('T')[0];

            // Show classes where (day matches AND no specific date is set) OR (specific date matches today)
            const { results } = await db.prepare(`
                SELECT * FROM classes 
                WHERE user_id = ? AND status = 'Active' 
                AND (
                    (day = ? AND (class_date IS NULL OR class_date = ''))
                    OR 
                    (class_date = ?)
                )
                ORDER BY start_time ASC
            `).bind(userId, todayDay, todayDate).all();
            
            return json(results || []);
        }

        // SUBJECTS
        if (path === 'subjects') {
            if (method === 'GET') {
                const { results } = await db.prepare("SELECT * FROM subjects WHERE user_id = ? ORDER BY name ASC").bind(userId).all();
                return json(results || []);
            }
            if (method === 'POST') {
                const d = await request.json();
                await db.prepare("INSERT INTO subjects (user_id, name, code, description) VALUES (?, ?, ?, ?)").bind(userId, d.name, d.code, d.description).run();
                return json({ message: "Added" });
            }
            if (method === 'PUT' && subPath) {
                const d = await request.json();
                await db.prepare("UPDATE subjects SET name = ?, code = ?, description = ? WHERE id = ? AND user_id = ?").bind(d.name, d.code, d.description, subPath, userId).run();
                return json({ message: "Updated" });
            }
            if (method === 'DELETE' && subPath) {
                await db.prepare("DELETE FROM subjects WHERE id = ? AND user_id = ?").bind(subPath, userId).run();
                return json({ message: "Deleted" });
            }
        }

        // MESSAGES
        if (path === 'messages') {
            if (method === 'GET') {
                const { results } = await db.prepare("SELECT *, created_at as sent_at FROM messages WHERE user_id = ? AND status != 'Log' ORDER BY created_at DESC LIMIT 50").bind(userId).all();
                return json(results || []);
            }
            if (method === 'POST') {
                const d = await request.json();
                await db.prepare("INSERT INTO messages (user_id, content, recipient_type, recipient_id, recipient_name, status) VALUES (?, ?, ?, ?, ?, ?)")
                    .bind(userId, d.content, d.recipient_type, d.recipient_id, d.recipient_name, d.status).run();
                return json({ message: "Sent" });
            }
            if (method === 'DELETE' && subPath) {
                await db.prepare("DELETE FROM messages WHERE id = ? AND user_id = ?").bind(subPath, userId).run();
                return json({ message: "Deleted" });
            }
        }

        // ACTIVITIES
        if (path === 'activities' && method === 'GET') {
            const { results } = await db.prepare("SELECT content as description, recipient_type as type, created_at || 'Z' as created_at FROM messages WHERE user_id = ? AND status = 'Log' ORDER BY created_at DESC LIMIT 10").bind(userId).all();
            return json(results || []);
        }

        // ADMIN PROFILES (Super Admin Only)
        if (path === 'profiles') {
            if (payload.role !== 'super-admin') return json({ error: "Forbidden" }, 403);

            if (method === 'GET') {
                const { results } = await db.prepare("SELECT id, email, whatsapp_number, role, is_approved, created_at FROM profiles ORDER BY created_at DESC").all();
                return json(results || []);
            }
            if (method === 'PUT' && subPath && pathParts[2] === 'approve') {
                const { is_approved } = await request.json();
                await db.prepare("UPDATE profiles SET is_approved = ?, role = ? WHERE id = ?").bind(is_approved ? 1 : 0, is_approved ? 'admin' : 'pending', subPath).run();
                return json({ message: "Approved" });
            }
            if (method === 'DELETE' && subPath) {
                await db.prepare("DELETE FROM profiles WHERE id = ?").bind(subPath).run();
                return json({ message: "Deleted" });
            }
        }

        return json({ error: "Route not found", path, subPath }, 404);

    } catch (e) {
        console.error('API Error:', e);
        return json({ error: "Server Error", details: e.message }, 500);
    }
}
