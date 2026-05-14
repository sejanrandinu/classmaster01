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

// Helper: Verify Turnstile Token
async function verifyTurnstile(token, secretKey) {
    if (!token) return false;
    try {
        const body = new URLSearchParams();
        body.append('secret', secretKey);
        body.append('response', token);
        const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const result = await fetch(url, {
            body: body.toString(),
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const outcome = await result.json();
        return outcome.success;
    } catch (e) {
        console.error('Turnstile Error:', e);
        return false;
    }
}

// Helper: Send Email (Supports Resend API or Fallback to MailChannels)
async function sendEmail(toEmail, subject, htmlContent, env) {
    // 1. Try Resend if API Key exists
    if (env.RESEND_API_KEY) {
        try {
            const resendRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'ClassMaster <onboarding@resend.dev>', // Use verified domain once set up
                    to: toEmail,
                    subject: subject,
                    html: htmlContent
                })
            });
            if (resendRes.ok) return true;
            console.error('Resend API error:', await resendRes.text());
        } catch (e) {
            console.error('Resend Fetch Error:', e);
        }
    }

    // 2. Fallback: MailChannels (Free for Cloudflare Workers)
    try {
        const sendReq = new Request('https://api.mailchannels.net/tx/v1/send', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: toEmail }] }],
                from: { email: 'noreply@classmaster.lk', name: 'ClassMaster' },
                subject: subject,
                content: [{ type: 'text/html', value: htmlContent }]
            }),
        });
        await fetch(sendReq);
        return true;
    } catch (e) {
        console.error('MailChannels Error:', e);
        return false;
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

        // --- CLEANUP EXPIRED TRIALS (Runs on every request, but very fast in D1) ---
        await db.prepare(`
            DELETE FROM profiles 
            WHERE trial_ends_at IS NOT NULL 
            AND is_approved = 0 
            AND role != 'super-admin'
            AND datetime(trial_ends_at, '+3 days') < datetime('now')
        `).run();

        // --- AUTH ---
        if (path === 'auth' && subPath === 'register' && method === 'POST') {
            const { email, password, whatsapp, turnstileToken } = await request.json();
            
            // Turnstile Validation
            const turnstileSecret = env.TURNSTILE_SECRET || '0x4AAAAAADHUUik0ac64rysfxgfCWL1Wmcg';
            const isValid = await verifyTurnstile(turnstileToken, turnstileSecret);
            if (!isValid) return json({ error: "Invalid Turnstile token. Please verify you are human." }, 400);

            const id = crypto.randomUUID();
            const password_hash = await hashString(password + JWT_SECRET);
            const isSuperAdmin = email.trim().toLowerCase() === 'sejanrandinu01@gmail.com';
            
            // Set to 'trial' role with is_approved=0. 
            // They will be allowed access until trial ends.
            const role = isSuperAdmin ? 'super-admin' : 'trial';
            const approved = isSuperAdmin ? 1 : 0;
            
            const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            
            // Email verification removed by user request - set to 1 by default
            await db.prepare("INSERT INTO profiles (id, email, password_hash, whatsapp_number, role, is_approved, is_email_verified, verification_token, trial_ends_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(id, email, password_hash, whatsapp, role, approved, 1, null, trialEndsAt).run();
            
            const token = await signJWT({ id, email, role, is_email_verified: 1, trial_ends_at: trialEndsAt }, JWT_SECRET);
            return json({ message: "Registered", token, user: { id, email, role, is_email_verified: 1, trial_ends_at: trialEndsAt } });
        }

        if (path === 'auth' && subPath === 'login' && method === 'POST') {
            const { email, password, turnstileToken } = await request.json();

            // Turnstile Validation
            const turnstileSecret = env.TURNSTILE_SECRET || '0x4AAAAAADHUUik0ac64rysfxgfCWL1Wmcg';
            const isValid = await verifyTurnstile(turnstileToken, turnstileSecret);
            if (!isValid) return json({ error: "Invalid Turnstile token. Please verify you are human." }, 400);

            const password_hash = await hashString(password + JWT_SECRET);
            const user = await db.prepare("SELECT * FROM profiles WHERE email = ? AND password_hash = ?").bind(email, password_hash).first();
            if (!user) return json({ error: "Invalid credentials" }, 401);
            
            const token = await signJWT({ id: user.id, email: user.email, role: user.role, is_email_verified: user.is_email_verified, trial_ends_at: user.trial_ends_at }, JWT_SECRET);
            return json({ message: "Logged in", token, user: { id: user.id, email: user.email, role: user.role, is_email_verified: user.is_email_verified, trial_ends_at: user.trial_ends_at } });
        }

        if (path === 'auth' && subPath === 'verify-email' && method === 'POST') {
            const { token } = await request.json();
            const user = await db.prepare("SELECT * FROM profiles WHERE verification_token = ?").bind(token).first();
            if (!user) return json({ error: "Invalid or expired token" }, 400);
            await db.prepare("UPDATE profiles SET is_email_verified = 1, verification_token = NULL WHERE id = ?").bind(user.id).run();
            return json({ message: "Email verified successfully" });
        }

        if (path === 'auth' && subPath === 'resend-verification' && method === 'POST') {
            const { email } = await request.json();
            const user = await db.prepare("SELECT * FROM profiles WHERE email = ?").bind(email).first();
            if (!user) return json({ error: "User not found" }, 404);
            if (user.is_email_verified) return json({ error: "Email already verified" }, 400);

            const verificationToken = crypto.randomUUID();
            await db.prepare("UPDATE profiles SET verification_token = ? WHERE id = ?").bind(verificationToken, user.id).run();
            
            const verifyLink = `${url.origin}/verify-email?token=${verificationToken}`;
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #2563eb;">Verify your ClassMaster account</h2>
                    <p>Hello,</p>
                    <p>Please click the button below to verify your email address and continue using ClassMaster:</p>
                    <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Verify Email</a>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p>${verifyLink}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #666;">This is an automated message, please do not reply.</p>
                </div>
            `;
            await sendEmail(email, 'Verify your ClassMaster account', emailHtml, env);
            
            // Fallback: Save to system notifications
            await db.prepare("INSERT INTO system_notifications (id, type, recipient, content) VALUES (?, ?, ?, ?)")
                .bind(crypto.randomUUID(), 'email_verification_resend', email, verifyLink).run();
            
            return json({ message: "Verification email sent" });
        }

        // --- PUBLIC PORTAL ---
        if (path === 'students' && subPath === 'public-portal' && method === 'GET') {
            const sid = pathParts[2];
            const student = await db.prepare("SELECT id, student_id, name, grade, subjects_json FROM students WHERE student_id = ?").bind(sid).first();
            if (!student) return json(null);

            const studentDbId = student.id;
            try { student.subjects = JSON.parse(student.subjects_json || '[]'); } catch (e) { student.subjects = []; }

            const { results: attendance } = await db.prepare("SELECT a.*, c.name as class_name FROM attendance a LEFT JOIN classes c ON a.class_id = c.id WHERE a.student_id = ? ORDER BY a.date DESC LIMIT 10").bind(studentDbId).all();
            const { results: payments } = await db.prepare("SELECT * FROM payments WHERE student_id = ? ORDER BY created_at DESC LIMIT 10").bind(studentDbId).all();
            
            // Fetch Exam Results with Rankings
            const { results: rawResults } = await db.prepare(`
                SELECT 
                    er.*, 
                    e.title as exam_title, 
                    e.max_marks,
                    e.subject_name,
                    (SELECT COUNT(*) + 1 FROM exam_results WHERE exam_id = er.exam_id AND marks_obtained > er.marks_obtained) as rank,
                    (SELECT COUNT(*) FROM exam_results WHERE exam_id = er.exam_id) as total_students,
                    (SELECT AVG(marks_obtained) FROM exam_results WHERE exam_id = er.exam_id) as average_marks
                FROM exam_results er
                LEFT JOIN exams e ON er.exam_id = e.id
                WHERE er.student_id = ?
                ORDER BY e.date DESC
            `).bind(studentDbId).all();

            // Add Color Coding based on performance percentage
            const examResults = rawResults.map(r => {
                const percentage = (r.marks_obtained / r.max_marks) * 100;
                let group = 'red';
                if (percentage >= 75) group = 'green';
                else if (percentage >= 65) group = 'blue';
                else if (percentage >= 45) group = 'yellow';
                
                return { ...r, percentage, group };
            });

            return json({ student, attendance, payments, examResults });
        }

        // --- PROTECTED ---
        const authHeader = request.headers.get('Authorization');
        const tokenStr = authHeader?.split(' ')[1];
        const payload = tokenStr ? await verifyJWT(tokenStr, JWT_SECRET) : null;
        if (!payload) return json({ error: "Unauthorized" }, 401);
        const userId = payload.id;
        const userEmail = payload.email;

        let currentUser = null;
        try {
            currentUser = await db.prepare("SELECT role, is_approved, trial_ends_at FROM profiles WHERE id = ?").bind(userId).first();
        } catch (e) {
            console.error('DB Fetch error in middleware:', e);
            // Fallback for missing columns
            currentUser = await db.prepare("SELECT role, is_approved FROM profiles WHERE id = ?").bind(userId).first();
        }
        
        if (!currentUser) return json({ error: "User not found" }, 401);

        // Trial & Approval Logic
        const isSuperAdmin = userEmail.trim().toLowerCase() === 'sejanrandinu01@gmail.com';
        
        if (!isSuperAdmin) {
            const now = new Date();
            const trialEnd = currentUser.trial_ends_at ? new Date(currentUser.trial_ends_at) : null;
            
            // 1. Handle Trial Expiration
            if (trialEnd && trialEnd < now && !currentUser.is_approved) {
                // If trial expired and not yet permanently approved
                if (currentUser.role !== 'pending') {
                    await db.prepare("UPDATE profiles SET role = 'pending', is_approved = 0 WHERE id = ?").bind(userId).run();
                }
                
                return json({ 
                    error: "Trial Expired", 
                    details: "Your 7-day free trial has expired. Please contact admin to activate your account.",
                    isTrialExpired: true 
                }, 403);
            }

            // 2. Allow Trial Users OR Approved Members
            const isTrialActive = currentUser.role === 'trial' && (trialEnd ? trialEnd > now : true);
            if (!currentUser.is_approved && !isTrialActive) {
                return json({ 
                    error: "Access Denied", 
                    details: "Your account is pending approval or your trial has ended." 
                }, 403);
            }
        }

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
                try {
                    const user = await db.prepare("SELECT id, email, whatsapp_number, role, is_approved, is_email_verified, trial_ends_at, bank_name, account_number, account_holder_name, created_at, card_background_url, card_theme_color, card_layout_type, card_show_visuals FROM profiles WHERE id = ?").bind(userId).first();
                    return json(user);
                } catch (e) {
                    console.error('Fetch me error:', e);
                    // Fallback to minimal set if columns missing
                    const user = await db.prepare("SELECT id, email, role, is_approved, created_at FROM profiles WHERE id = ?").bind(userId).first();
                    return json(user);
                }
            }
            if (method === 'POST') {
                const d = await request.json();
                await db.prepare("UPDATE profiles SET whatsapp_number = ?, bank_name = ?, account_number = ?, account_holder_name = ?, card_background_url = ?, card_theme_color = ?, card_layout_type = ?, card_show_visuals = ? WHERE id = ?").bind(d.whatsapp_number, d.bank_name, d.account_number, d.account_holder_name, d.card_background_url || null, d.card_theme_color || '#0d124d', d.card_layout_type || 'standard', d.card_show_visuals ?? 1, userId).run();
                return json({ message: "Updated" });
            }
            if (method === 'PUT' && subPath === 'password') {
                const { password } = await request.json();
                const password_hash = await hashString(password + JWT_SECRET);
                await db.prepare("UPDATE profiles SET password_hash = ? WHERE id = ?").bind(password_hash, userId).run();
                return json({ message: "Password updated" });
            }
        }

        // SYSTEM LOGS (Super Admin only)
        if (path === 'system' && subPath === 'verification-links' && method === 'GET') {
            if (userEmail.trim().toLowerCase() !== 'sejanrandinu01@gmail.com') return json({ error: "Forbidden" }, 403);
            const links = await db.prepare("SELECT * FROM system_notifications WHERE type LIKE 'email_verification%' ORDER BY created_at DESC LIMIT 10").all();
            return json(links.results);
        }

        // STUDENTS
        if (path === 'students') {
            if (method === 'GET') {
                if (subPath === 'by-id') {
                    const sid = pathParts[2];
                    const s = await db.prepare("SELECT * FROM students WHERE user_id = ? AND student_id = ?").bind(userId, sid).first();
                    if (s) {
                        try { s.subjects = JSON.parse(s.subjects_json || '[]'); } catch (e) { s.subjects = []; }
                    }
                    return json(s);
                }
                const grade = url.searchParams.get('grade');
                const status = url.searchParams.get('status');
                let q = "SELECT * FROM students WHERE user_id = ?";
                const p = [userId];
                if (grade) { q += " AND grade = ?"; p.push(grade); }
                if (status) { q += " AND status = ?"; p.push(status); }
                const { results: students } = await db.prepare(q + " ORDER BY name ASC").bind(...p).all();
                const { results: classes } = await db.prepare("SELECT subject_name, whatsapp_group_url FROM classes WHERE user_id = ? AND whatsapp_group_url IS NOT NULL").bind(userId).all();
                
                const mapped = (students || []).map(s => {
                    let subjects = [];
                    try { subjects = JSON.parse(s.subjects_json || '[]'); } catch (e) { subjects = []; }
                    
                    const groups = (classes || [])
                        .filter(c => subjects.includes(c.subject_name))
                        .map(c => c.whatsapp_group_url);
                        
                    return { 
                        ...s, 
                        subjects,
                        whatsapp_group_url: groups.length > 0 ? groups[0] : null,
                        all_whatsapp_groups: groups
                    };
                });
                return json(mapped);
            }
            if (method === 'POST') {
                const d = await request.json();
                await db.prepare("INSERT INTO students (user_id, student_id, name, school, grade, contact, status, subjects_json, image_url, color_theme, layout_type, show_visuals) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                    .bind(userId, d.student_id, d.name, d.school, d.grade, d.contact, d.status || 'Active', JSON.stringify(d.subjects || []), d.image_url || null, d.color_theme || null, d.layout_type || 'standard', d.show_visuals ?? 1).run();
                await logActivity('student', `Added student ${d.name}`);
                return json({ message: "Added" });
            }
            if (method === 'PUT' && subPath) {
                const d = await request.json();
                await db.prepare("UPDATE students SET student_id = ?, name = ?, school = ?, grade = ?, contact = ?, status = ?, subjects_json = ?, image_url = ?, color_theme = ?, layout_type = ?, show_visuals = ? WHERE id = ? AND user_id = ?")
                    .bind(d.student_id, d.name, d.school, d.grade, d.contact, d.status, JSON.stringify(d.subjects || []), d.image_url || null, d.color_theme || null, d.layout_type || 'standard', d.show_visuals ?? 1, subPath, userId).run();
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

                let q = "SELECT id, name, name as class_name, tutor_name, tutor_name as tutor, subject_name, subject_name as subject, grade, day, class_date, start_time, end_time, fee, status, image_url, color_theme, whatsapp_group_url FROM classes WHERE user_id = ?";
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
                try {
                    await db.prepare("INSERT INTO classes (user_id, name, tutor_name, subject_name, grade, day, class_date, start_time, end_time, fee, status, image_url, color_theme, whatsapp_group_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                        .bind(userId, d.class_name, d.tutor, d.subject, d.grade, d.day, d.class_date || null, d.start_time, d.end_time, d.fee, d.status || 'Active', d.image_url || null, d.color_theme || null, d.whatsapp_group_url || null).run();
                    await logActivity('class', `Scheduled class ${d.class_name}`);
                    return json({ message: "Added" });
                } catch (e) {
                    console.error('Class Insert Error:', e);
                    return json({ error: e.message }, 500);
                }
            }
            if (method === 'PUT' && subPath) {
                const d = await request.json();
                try {
                    await db.prepare("UPDATE classes SET name = ?, tutor_name = ?, subject_name = ?, grade = ?, day = ?, class_date = ?, start_time = ?, end_time = ?, fee = ?, status = ?, image_url = ?, color_theme = ?, whatsapp_group_url = ? WHERE id = ? AND user_id = ?")
                        .bind(d.class_name, d.tutor, d.subject, d.grade, d.day, d.class_date || null, d.start_time, d.end_time, d.fee, d.status, d.image_url || null, d.color_theme || null, d.whatsapp_group_url || null, subPath, userId).run();
                    return json({ message: "Updated" });
                } catch (e) {
                    console.error('Class Update Error:', e);
                    return json({ error: e.message }, 500);
                }
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

        // TUTES
        if (path === 'tutes') {
            if (method === 'GET') {
                const className = url.searchParams.get('class_name');
                const subjectName = url.searchParams.get('subject_name');
                let q = "SELECT * FROM tutes WHERE user_id = ?";
                const p = [userId];
                if (className) { q += " AND class_name = ?"; p.push(className); }
                if (subjectName) { q += " AND subject_name = ?"; p.push(subjectName); }
                const { results } = await db.prepare(q + " ORDER BY created_at DESC").bind(...p).all();
                return json(results || []);
            }
            if (method === 'POST') {
                const d = await request.json();
                await db.prepare("INSERT INTO tutes (user_id, title, description, class_name, subject_name, file_url, file_type, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                    .bind(userId, d.title, d.description, d.class_name, d.subject_name, d.file_url, d.file_type || 'pdf', d.is_active ?? 1).run();
                await logActivity('tute', `Uploaded tute: ${d.title}`);
                return json({ message: "Added" });
            }
            if (method === 'PUT' && subPath) {
                const d = await request.json();
                await db.prepare("UPDATE tutes SET title = ?, description = ?, class_name = ?, subject_name = ?, file_url = ?, file_type = ?, is_active = ? WHERE id = ? AND user_id = ?")
                    .bind(d.title, d.description, d.class_name, d.subject_name, d.file_url, d.file_type, d.is_active, subPath, userId).run();
                return json({ message: "Updated" });
            }
            if (method === 'DELETE' && subPath) {
                await db.prepare("DELETE FROM tutes WHERE id = ? AND user_id = ?").bind(subPath, userId).run();
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
                // Clear trial_ends_at when approved to make the user permanent
                await db.prepare("UPDATE profiles SET is_approved = ?, role = ?, trial_ends_at = NULL WHERE id = ?").bind(is_approved ? 1 : 0, is_approved ? 'admin' : 'pending', subPath).run();
                return json({ message: "Approved" });
            }
            if (method === 'DELETE' && subPath) {
                await db.prepare("DELETE FROM profiles WHERE id = ?").bind(subPath).run();
                return json({ message: "Deleted" });
            }
        }

        // STUDENT TUTES (Physical Tracking)
        if (path === 'student-tutes') {
            if (method === 'GET') {
                const sid = url.searchParams.get('student_id');
                const tid = url.searchParams.get('tute_id');
                let q = "SELECT * FROM student_tutes WHERE user_id = ?";
                const p = [userId];
                if (sid) { q += " AND student_id = ?"; p.push(sid); }
                if (tid) { q += " AND tute_id = ?"; p.push(tid); }
                const { results } = await db.prepare(q).bind(...p).all();
                return json(results || []);
            }
            if (method === 'POST') {
                const { student_id, tute_id, status } = await request.json();
                await db.prepare("INSERT INTO student_tutes (user_id, student_id, tute_id, status) VALUES (?, ?, ?, ?) ON CONFLICT(student_id, tute_id) DO UPDATE SET status = excluded.status, received_date = CURRENT_TIMESTAMP")
                    .bind(userId, student_id, tute_id, status || 'Received').run();
                return json({ message: "Updated" });
            }
            if (method === 'DELETE') {
                const sid = url.searchParams.get('student_id');
                const tid = url.searchParams.get('tute_id');
                await db.prepare("DELETE FROM student_tutes WHERE user_id = ? AND student_id = ? AND tute_id = ?").bind(userId, sid, tid).run();
                return json({ message: "Deleted" });
            }
        }
        // EXAMS
        if (path === 'exams') {
            if (method === 'GET') {
                const { results } = await db.prepare("SELECT e.*, c.name as class_name FROM exams e LEFT JOIN classes c ON e.class_id = c.id WHERE c.user_id = ? ORDER BY e.date DESC").bind(userId).all();
                return json(results || []);
            }
            if (method === 'POST') {
                const d = await request.json();
                const id = crypto.randomUUID();
                await db.prepare("INSERT INTO exams (id, title, class_id, subject_name, date, max_marks) VALUES (?, ?, ?, ?, ?, ?)")
                    .bind(id, d.title, d.class_id, d.subject_name, d.date, d.max_marks || 100).run();
                return json({ message: "Created", id });
            }
            if (method === 'PUT' && subPath) {
                const d = await request.json();
                await db.prepare("UPDATE exams SET title = ?, subject_name = ?, date = ?, max_marks = ? WHERE id = ?").bind(d.title, d.subject_name, d.date, d.max_marks, subPath).run();
                return json({ message: "Updated" });
            }
            if (method === 'DELETE' && subPath) {
                await db.prepare("DELETE FROM exams WHERE id = ?").bind(subPath).run();
                await db.prepare("DELETE FROM exam_results WHERE exam_id = ?").bind(subPath).run();
                return json({ message: "Deleted" });
            }
        }

        // EXAM RESULTS
        if (path === 'exam-results') {
            if (method === 'GET') {
                const examId = url.searchParams.get('exam_id');
                const { results } = await db.prepare("SELECT er.*, s.name as student_name, s.student_id as student_id_str FROM exam_results er JOIN students s ON er.student_id = s.id WHERE er.exam_id = ?").bind(examId).all();
                return json(results || []);
            }
            if (subPath === 'upsert' && method === 'POST') {
                const { exam_id, results } = await request.json();
                for (const r of results) {
                    await db.prepare("INSERT INTO exam_results (id, exam_id, student_id, marks_obtained, remarks) VALUES (?, ?, ?, ?, ?) ON CONFLICT(exam_id, student_id) DO UPDATE SET marks_obtained = excluded.marks_obtained, remarks = excluded.remarks")
                        .bind(crypto.randomUUID(), exam_id, r.student_id, Number(r.marks_obtained), r.remarks || '').run();
                }
                return json({ message: "Saved" });
            }
        }

        return json({ error: "Route not found", path, subPath }, 404);

    } catch (e) {
        console.error('API Error:', e);
        return json({ error: "Server Error", details: e.message }, 500);
    }
}
