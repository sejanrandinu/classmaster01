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

        // --- ACTIVITY LOGGER HELPER ---
        async function logActivity(type, description, amount = 0) {
            try {
                await db.prepare("INSERT INTO messages (user_id, content, recipient_type, status) VALUES (?, ?, ?, ?)")
                    .bind(userId, description, type, 'Log')
                    .run();
                // Note: Using 'messages' table as a temporary activity log since 'activities' table wasn't in schema.sql
            } catch (e) {
                console.error('Log activity error:', e);
            }
        }

        // --- OTHER ROUTES ---
        
        // STUDENTS
        if (path === 'students' && method === 'GET') {
            const grade = url.searchParams.get('grade');
            const status = url.searchParams.get('status');
            let query = "SELECT * FROM students WHERE user_id = ?";
            const params = [userId];
            
            if (grade) {
                query += " AND grade = ?";
                params.push(grade);
            }
            if (status) {
                query += " AND status = ?";
                params.push(status);
            }
            
            query += " ORDER BY created_at DESC";
            const { results } = await db.prepare(query).bind(...params).all();
            return json(results || []);
        }

        if (path.startsWith('students/by-id/') && method === 'GET') {
            const studentIdStr = path.split('/')[2];
            const student = await db.prepare("SELECT * FROM students WHERE user_id = ? AND student_id = ?")
                .bind(userId, studentIdStr)
                .first();
            return json(student || null);
        }

        if (path === 'students' && method === 'POST') {
            const data = await request.json();
            const subjects_json = data.subjects ? JSON.stringify(data.subjects) : '[]';
            await db.prepare("INSERT INTO students (user_id, student_id, name, school, grade, contact, status, subjects_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(userId, data.student_id, data.name, data.school, data.grade, data.contact, data.status || 'Active', subjects_json)
                .run();
            await logActivity('student', `Added new student: ${data.name}`);
            return json({ message: "Student added" });
        }

        if (path.startsWith('students/') && method === 'PUT') {
            const id = path.split('/')[1];
            if (id && id !== 'by-id') {
                const data = await request.json();
                const subjects_json = data.subjects ? JSON.stringify(data.subjects) : '[]';
                await db.prepare("UPDATE students SET name = ?, school = ?, grade = ?, contact = ?, status = ?, subjects_json = ? WHERE id = ? AND user_id = ?")
                    .bind(data.name, data.school, data.grade, data.contact, data.status, subjects_json, id, userId)
                    .run();
                await logActivity('student', `Updated student: ${data.name}`);
                return json({ message: "Student updated" });
            }
        }

        if (path.startsWith('students/') && method === 'DELETE') {
            const id = path.split('/')[1];
            await db.prepare("DELETE FROM students WHERE id = ? AND user_id = ?").bind(id, userId).run();
            await logActivity('student', `Deleted a student record`);
            return json({ message: "Student deleted" });
        }

        // TUTORS
        if (path === 'tutors' && method === 'GET') {
            const { results } = await db.prepare("SELECT * FROM tutors WHERE user_id = ?").bind(userId).all();
            return json(results || []);
        }

        if (path === 'tutors' && method === 'POST') {
            const data = await request.json();
            const grades_json = data.grades ? JSON.stringify(data.grades) : '[]';
            await db.prepare("INSERT INTO tutors (user_id, name, subject, email, phone, grades_json, bank_name, bank_account_name, bank_account_number, bank_branch) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(userId, data.name, data.subject, data.email, data.phone, grades_json, data.bank_name, data.bank_account_name, data.bank_account_number, data.bank_branch)
                .run();
            await logActivity('tutor', `Added tutor: ${data.name}`);
            return json({ message: "Tutor added" });
        }

        if (path.startsWith('tutors/') && method === 'PUT') {
            const id = path.split('/')[1];
            const data = await request.json();
            const grades_json = data.grades ? JSON.stringify(data.grades) : '[]';
            await db.prepare("UPDATE tutors SET name = ?, subject = ?, email = ?, phone = ?, grades_json = ?, bank_name = ?, bank_account_name = ?, bank_account_number = ?, bank_branch = ? WHERE id = ? AND user_id = ?")
                .bind(data.name, data.subject, data.email, data.phone, grades_json, data.bank_name, data.bank_account_name, data.bank_account_number, data.bank_branch, id, userId)
                .run();
            await logActivity('tutor', `Updated tutor: ${data.name}`);
            return json({ message: "Tutor updated" });
        }

        if (path.startsWith('tutors/') && method === 'DELETE') {
            const id = path.split('/')[1];
            await db.prepare("DELETE FROM tutors WHERE id = ? AND user_id = ?").bind(id, userId).run();
            await logActivity('tutor', `Deleted a tutor record`);
            return json({ message: "Tutor deleted" });
        }

        // CLASSES
        if (path === 'classes' && method === 'GET') {
            const grade = url.searchParams.get('grade');
            const status = url.searchParams.get('status');
            let query = "SELECT * FROM classes WHERE user_id = ?";
            const params = [userId];
            
            if (grade) {
                query += " AND grade = ?";
                params.push(grade);
            }
            if (status) {
                query += " AND status = ?";
                params.push(status);
            }
            
            query += " ORDER BY created_at DESC";
            const { results } = await db.prepare(query).bind(...params).all();
            return json(results || []);
        }


        if (path === 'classes' && method === 'POST') {
            const data = await request.json();
            await db.prepare("INSERT INTO classes (user_id, name, subject_name, tutor_name, grade, day, class_date, start_time, end_time, fee, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(userId, data.class_name, data.subject, data.tutor, data.grade, data.day, data.class_date, data.start_time, data.end_time, data.fee, data.status)
                .run();
            await logActivity('class', `Scheduled class: ${data.class_name}`);
            return json({ message: "Class added" });
        }

        if (path.startsWith('classes/') && method === 'PUT') {
            const id = path.split('/')[1];
            const data = await request.json();
             await db.prepare("UPDATE classes SET name = ?, subject_name = ?, tutor_name = ?, grade = ?, day = ?, class_date = ?, start_time = ?, end_time = ?, fee = ?, status = ? WHERE id = ? AND user_id = ?")
                .bind(data.class_name, data.subject, data.tutor, data.grade, data.day, data.class_date, data.start_time, data.end_time, data.fee, data.status, id, userId)
                .run();
            await logActivity('class', `Updated class: ${data.class_name}`);
            return json({ message: "Class updated" });
        }

        if (path.startsWith('classes/') && method === 'DELETE') {
            const id = path.split('/')[1];
            await db.prepare("DELETE FROM classes WHERE id = ? AND user_id = ?").bind(id, userId).run();
            await logActivity('class', `Deleted a class record`);
            return json({ message: "Class deleted" });
        }

        // PAYMENTS
        if (path === 'payments' && method === 'GET') {
            // Join with students and classes for frontend display
            const { results } = await db.prepare(`
                SELECT p.*, s.name as student_name, s.student_id as student_id_str, c.name as class_name 
                FROM payments p
                LEFT JOIN students s ON p.student_id = s.id
                LEFT JOIN classes c ON p.class_id = c.id
                WHERE p.user_id = ? 
                ORDER BY p.payment_date DESC, p.created_at DESC
                LIMIT 50
            `).bind(userId).all();
            return json(results || []);
        }

        if (path === 'payments' && method === 'POST') {
            const data = await request.json();
            await db.prepare("INSERT INTO payments (user_id, student_id, class_id, amount, month, payment_date, receipt_no, payment_method) VALUES (?, ?, ?, ?, ?, CURRENT_DATE, ?, ?)")
                .bind(userId, data.student_id, data.class_id, data.amount, data.month, data.receipt_no, data.payment_method)
                .run();
            await logActivity('payment', `Collected fee: Rs. ${data.amount}`);
            return json({ message: "Payment recorded" });
        }

        if (path.startsWith('payments/') && method === 'DELETE') {
            const id = path.split('/')[1];
            await db.prepare("DELETE FROM payments WHERE id = ? AND user_id = ?").bind(id, userId).run();
            await logActivity('payment', `Deleted a payment record`);
            return json({ message: "Payment deleted" });
        }

        // ATTENDANCE
        if (path === 'attendance' && method === 'GET') {
            const class_id = url.searchParams.get('class_id');
            const date = url.searchParams.get('date');
            const { results } = await db.prepare("SELECT * FROM attendance WHERE user_id = ? AND class_id = ? AND date = ?")
                .bind(userId, class_id, date)
                .all();
            return json(results || []);
        }

        if (path === 'attendance/upsert' && method === 'POST') {
            const { records } = await request.json();
            for (const rec of records) {
                await db.prepare(`
                    INSERT INTO attendance (user_id, student_id, class_id, date, status) 
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(student_id, class_id, date) DO UPDATE SET status = excluded.status
                `).bind(userId, rec.student_id, rec.class_id, rec.date, rec.status).run();
            }
            return json({ message: "Attendance saved" });
        }

        // STAFF
        if (path === 'staff' && method === 'GET') {
            const { results: staffResults } = await db.prepare("SELECT * FROM staff WHERE user_id = ?").bind(userId).all();
            
            // For each staff, fetch their recent payments (optional optimization: do a JOIN or separate query)
            const staffWithPayments = [];
            for (const staff of staffResults) {
                const { results: payResults } = await db.prepare("SELECT * FROM salary_payments WHERE staff_id = ? AND user_id = ? ORDER BY payment_date DESC LIMIT 5")
                    .bind(staff.id, userId).all();
                staffWithPayments.push({ ...staff, salary_payments: payResults || [] });
            }
            
            return json(staffWithPayments);
        }

        if (path === 'staff' && method === 'POST') {
            const data = await request.json();
            await db.prepare("INSERT INTO staff (user_id, name, role, whatsapp_number, salary, status) VALUES (?, ?, ?, ?, ?, ?)")
                .bind(userId, data.name, data.role, data.whatsapp_number, data.salary, data.status || 'Active')
                .run();
            return json({ message: "Staff added" });
        }

        if (path.startsWith('staff/') && method === 'PUT') {
            const id = path.split('/')[1];
            if (id && !path.includes('/payments')) {
                const data = await request.json();
                await db.prepare("UPDATE staff SET name = ?, role = ?, whatsapp_number = ?, salary = ?, status = ? WHERE id = ? AND user_id = ?")
                    .bind(data.name, data.role, data.whatsapp_number, data.salary, data.status, id, userId)
                    .run();
                return json({ message: "Staff updated" });
            }
        }

        if (path.startsWith('staff/') && method === 'DELETE') {
            const id = path.split('/')[1];
            await db.prepare("DELETE FROM staff WHERE id = ? AND user_id = ?").bind(id, userId).run();
            return json({ message: "Staff removed" });
        }

        if (path.startsWith('staff/') && path.endsWith('/payments') && method === 'GET') {
            const id = path.split('/')[1];
            const { results } = await db.prepare("SELECT * FROM salary_payments WHERE staff_id = ? AND user_id = ? ORDER BY payment_date DESC")
                .bind(id, userId).all();
            return json(results || []);
        }

        // SALARY PAYMENTS
        if (path === 'salary_payments' && method === 'POST') {
            const data = await request.json();
            await db.prepare("INSERT INTO salary_payments (user_id, staff_id, amount, payment_date, notes) VALUES (?, ?, ?, ?, ?)")
                .bind(userId, data.staff_id, data.amount, data.payment_date, data.notes)
                .run();
            await logActivity('salary', `Paid salary to staff ID: ${data.staff_id}`);
            return json({ message: "Salary payment recorded" });
        }

        // STATS (Dashboard)
        if (path === 'stats' && method === 'GET') {
            const students = await db.prepare("SELECT COUNT(*) as count FROM students WHERE user_id = ?").bind(userId).first('count') || 0;
            const tutors = await db.prepare("SELECT COUNT(*) as count FROM tutors WHERE user_id = ?").bind(userId).first('count') || 0;
            const classes = await db.prepare("SELECT COUNT(*) as count FROM classes WHERE user_id = ?").bind(userId).first('count') || 0;
            const revenue = await db.prepare("SELECT SUM(amount) as sum FROM payments WHERE user_id = ? AND strftime('%m', payment_date) = strftime('%m', 'now')").bind(userId).first('sum') || 0;
            
            return json({
                students_count: students,
                tutors_count: tutors,
                total_classes: classes,
                monthly_revenue: revenue,
                monthly_expenses: 0
            });
        }

        // SCHEDULE
        if (path === 'schedule/today' && method === 'GET') {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const today = days[new Date().getDay()];
            const { results } = await db.prepare("SELECT * FROM classes WHERE user_id = ? AND day = ?").bind(userId, today).all();
            return json(results || []);
        }

        // SUBJECTS
        if (path === 'subjects' && method === 'GET') {
            const { results } = await db.prepare("SELECT * FROM subjects WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all();
            return json(results || []);
        }

        if (path === 'subjects' && method === 'POST') {
            const data = await request.json();
            await db.prepare("INSERT INTO subjects (user_id, name, code, description) VALUES (?, ?, ?, ?)")
                .bind(userId, data.name, data.code, data.description)
                .run();
            await logActivity('subject', `Added new subject: ${data.name}`);
            return json({ message: "Subject added" });
        }

        if (path.startsWith('subjects/') && method === 'PUT') {
            const id = path.split('/')[1];
            const data = await request.json();
            await db.prepare("UPDATE subjects SET name = ?, code = ?, description = ? WHERE id = ? AND user_id = ?")
                .bind(data.name, data.code, data.description, id, userId)
                .run();
            await logActivity('subject', `Updated subject: ${data.name}`);
            return json({ message: "Subject updated" });
        }

        if (path.startsWith('subjects/') && method === 'DELETE') {
            const id = path.split('/')[1];
            await db.prepare("DELETE FROM subjects WHERE id = ? AND user_id = ?").bind(id, userId).run();
            await logActivity('subject', `Deleted a subject`);
            return json({ message: "Subject deleted" });
        }

        // ACTIVITIES (Using messages table as log)
        if (path === 'activities' && method === 'GET') {
            const { results } = await db.prepare("SELECT content as description, recipient_type as type, created_at FROM messages WHERE user_id = ? AND status = 'Log' ORDER BY created_at DESC LIMIT 10")
                .bind(userId)
                .all();
            return json(results || []);
        }

        // PROFILES (ADMIN)
        if (path === 'profiles' && method === 'GET') {
             const { results } = await db.prepare("SELECT id, email, role, is_approved, created_at FROM profiles ORDER BY created_at DESC").all();
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

