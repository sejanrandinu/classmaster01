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

// Helper: Free Email Domain Verification (Checks if domain has MX records)
async function verifyEmailDomain(email) {
    try {
        const domain = email.split('@')[1];
        if (!domain) return false;
        
        // Use Cloudflare DNS over HTTPS to check MX records
        const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`, {
            headers: { 'accept': 'application/dns-json' }
        });
        const data = await res.json();
        
        // Status 0 means NOERROR, and Answer contains the MX records
        if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
            return true;
        }
        return false;
    } catch (e) {
        console.error('DNS MX Check Error:', e);
        return true; // Fallback to true if network error so we don't block users
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

        // --- SELF-HEALING DATABASE MIGRATIONS ---
        if (!globalThis.dbMigrated) {
            try {
                await db.prepare(`
                    CREATE TABLE IF NOT EXISTS discipline_records (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        student_id INTEGER NOT NULL,
                        type TEXT NOT NULL,
                        category TEXT NOT NULL,
                        description TEXT NOT NULL,
                        date TEXT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
                        FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
                    )
                `).run();
            } catch (e) {
                console.error("Migration warning (discipline_records):", e.message);
            }

            try {
                await db.prepare(`
                    CREATE TABLE IF NOT EXISTS pairing_sessions (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        class_id INTEGER NOT NULL,
                        type TEXT NOT NULL,
                        team_size INTEGER DEFAULT 2,
                        pairs_json TEXT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
                        FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
                    )
                `).run();
            } catch (e) {
                console.error("Migration warning (pairing_sessions):", e.message);
            }

            // Alter tables to add columns safely (try-catch because SQLite doesn't have ADD COLUMN IF NOT EXISTS)
            try { await db.prepare("ALTER TABLE exams ADD COLUMN sub_subjects_json TEXT").run(); } catch(e) {}
            try { await db.prepare("ALTER TABLE exam_results ADD COLUMN sub_marks_json TEXT").run(); } catch(e) {}
            try { await db.prepare("ALTER TABLE exam_results ADD COLUMN tutor_marks REAL").run(); } catch(e) {}
            try { await db.prepare("ALTER TABLE exam_results ADD COLUMN tutor_sub_marks_json TEXT").run(); } catch(e) {}
            try { await db.prepare("ALTER TABLE profiles ADD COLUMN whatsapp_enabled INTEGER DEFAULT 1").run(); } catch(e) {}
            try { await db.prepare("ALTER TABLE pairing_sessions ADD COLUMN is_active INTEGER DEFAULT 1").run(); } catch(e) {}

            globalThis.dbMigrated = true;
        }

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

            // Free Email Verification (Domain MX Check)
            const isEmailDomainValid = await verifyEmailDomain(email);
            if (!isEmailDomainValid) {
                return json({ error: "The email domain does not exist or cannot receive emails. Please use a valid email." }, 400);
            }

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
            try {
                const sid = pathParts[2];
                const student = await db.prepare("SELECT id, user_id, student_id, name, grade, subjects_json, status FROM students WHERE student_id = ?").bind(sid).first();
                if (!student) return json(null);

                const studentDbId = student.id;
                const instituteId = student.user_id;
                try { student.subjects = JSON.parse(student.subjects_json || '[]'); } catch (e) { student.subjects = []; }

                // Fetch tutor name matching student's grade and subjects
                let studentTutor = 'Dr. A.B. Sejan';
                try {
                    let matchingClass = null;
                    if (student.subjects && student.subjects.length > 0) {
                        const placeholders = student.subjects.map(() => "?").join(",");
                        matchingClass = await db.prepare(`
                            SELECT tutor_name FROM classes 
                            WHERE user_id = ? AND grade = ? AND subject_name IN (${placeholders}) 
                            LIMIT 1
                        `).bind(instituteId, student.grade, ...student.subjects).first();
                    }
                    if (!matchingClass) {
                        // Fallback 1: Match any class of the same grade
                        matchingClass = await db.prepare(`
                            SELECT tutor_name FROM classes 
                            WHERE user_id = ? AND grade = ?
                            LIMIT 1
                        `).bind(instituteId, student.grade).first();
                    }
                    if (matchingClass && matchingClass.tutor_name) {
                        studentTutor = matchingClass.tutor_name;
                    } else {
                        // Fallback 2: Check if student has exam results and get latest tutor
                        const latestResult = await db.prepare(`
                            SELECT c.tutor_name 
                            FROM exam_results er
                            JOIN exams e ON er.exam_id = e.id
                            JOIN classes c ON e.class_id = c.id
                            WHERE er.student_id = ?
                            ORDER BY e.date DESC
                            LIMIT 1
                        `).bind(studentDbId).first();
                        if (latestResult && latestResult.tutor_name) {
                            studentTutor = latestResult.tutor_name;
                        }
                    }
                } catch(e) {
                    console.error("Failed to determine tutor name:", e);
                }
                student.tutor_name = studentTutor;

                const { results: attendance } = await db.prepare("SELECT a.*, c.name as class_name FROM attendance a LEFT JOIN classes c ON a.class_id = c.id WHERE a.student_id = ? ORDER BY a.date DESC LIMIT 10").bind(studentDbId).all();
                const { results: payments } = await db.prepare("SELECT * FROM payments WHERE student_id = ? ORDER BY created_at DESC LIMIT 10").bind(studentDbId).all();
                
                // Self-heal exams schema for public portal if column doesn't exist yet
                try { await db.prepare("ALTER TABLE exams ADD COLUMN certificate_cutoff INTEGER DEFAULT 50").run(); } catch(e) {}

                // Fetch Exam Results — standard competition ranking computed in JS
                const { results: rawResults } = await db.prepare(`
                    SELECT 
                        er.*, 
                        e.title as exam_title, 
                        e.max_marks,
                        e.subject_name,
                        COALESCE(e.certificate_cutoff, 50) as certificate_cutoff,
                        c.tutor_name,
                        (SELECT COUNT(*) FROM exam_results WHERE exam_id = er.exam_id) as total_students,
                        (SELECT AVG(marks_obtained) FROM exam_results WHERE exam_id = er.exam_id) as average_marks,
                        (SELECT MAX(marks_obtained) FROM exam_results WHERE exam_id = er.exam_id) as highest_marks
                    FROM exam_results er
                    LEFT JOIN exams e ON er.exam_id = e.id
                    LEFT JOIN classes c ON e.class_id = c.id
                    WHERE er.student_id = ?
                    ORDER BY e.date ASC
                `).bind(studentDbId).all();

                // Compute equal (standard competition) rankings per exam
                // Group results by exam_id, rank within each group
                const examGroups = {};
                for (const r of (rawResults || [])) {
                    if (!examGroups[r.exam_id]) examGroups[r.exam_id] = [];
                    examGroups[r.exam_id].push(r);
                }
                const rankMap = {}; // key: "examId_studentId" => rank
                for (const [examId, rows] of Object.entries(examGroups)) {
                    // Fetch ALL results for this exam to compute proper rank
                    const { results: allForExam } = await db.prepare(
                        "SELECT student_id, marks_obtained FROM exam_results WHERE exam_id = ? ORDER BY marks_obtained DESC"
                    ).bind(examId).all();
                    let rank = 1;
                    for (let i = 0; i < allForExam.length; i++) {
                        if (i > 0 && allForExam[i].marks_obtained < allForExam[i - 1].marks_obtained) {
                            rank = i + 1;
                        }
                        rankMap[`${examId}_${allForExam[i].student_id}`] = rank;
                    }
                }

                const examResults = (rawResults || []).map(r => {
                    const percentage = (r.marks_obtained / (r.max_marks || 100)) * 100;
                    let group = 'red';
                    if (percentage >= 75) group = 'green';
                    else if (percentage >= 65) group = 'yellow';
                    else if (percentage >= 55) group = 'blue';
                    
                    let sub_marks = {};
                    let tutor_sub_marks = {};
                    try { sub_marks = JSON.parse(r.sub_marks_json || '{}'); } catch(e) {}
                    try { tutor_sub_marks = JSON.parse(r.tutor_sub_marks_json || '{}'); } catch(e) {}

                    const rank = rankMap[`${r.exam_id}_${r.student_id}`] || 1;
                    return { ...r, percentage, group, sub_marks, tutor_sub_marks, rank };
                });

                // Fetch Tutes (Filtered by institute, then we filter by subject in JS since class/subject logic varies)
                const { results: allTutes } = await db.prepare("SELECT * FROM tutes WHERE user_id = ? AND is_active = 1").bind(instituteId).all();
                const { results: studentTuteHistory } = await db.prepare("SELECT tute_id FROM student_tutes WHERE student_id = ?").bind(studentDbId).all();
                
                const tutes = (allTutes || []).filter(t => 
                    student.subjects && student.subjects.includes(t.subject_name)
                );
                const receivedTuteIds = (studentTuteHistory || []).map(h => h.tute_id);

                // Fetch Leaderboard for the latest exam
                let leaderboard = [];
                if (examResults && examResults.length > 0) {
                    const latestExamId = examResults[0].exam_id;
                    const { results: topStudents } = await db.prepare(`
                        SELECT s.name, er.marks_obtained, s.image_url
                        FROM exam_results er
                        JOIN students s ON er.student_id = s.id
                        WHERE er.exam_id = ?
                        ORDER BY er.marks_obtained DESC
                        LIMIT 5
                    `).bind(latestExamId).all();
                    leaderboard = topStudents || [];
                }

                // Fetch classes matching student grade to retrieve pairings
                const { results: classes } = await db.prepare("SELECT id FROM classes WHERE user_id = ? AND grade = ?").bind(instituteId, student.grade).all();
                const classIds = (classes || []).map(c => c.id);

                // Fetch pairings for student's classes
                let pairings = [];
                if (classIds.length > 0) {
                    const placeholders = classIds.map(() => "?").join(",");
                    const { results: pairingsList } = await db.prepare(`
                        SELECT p.*, c.name as class_name 
                        FROM pairing_sessions p
                        JOIN classes c ON p.class_id = c.id
                        WHERE p.class_id IN (${placeholders}) AND (p.is_active IS NULL OR p.is_active = 1)
                        ORDER BY p.created_at DESC
                    `).bind(...classIds).all();
                    
                    pairings = (pairingsList || []).map(p => {
                        try { p.pairs = JSON.parse(p.pairs_json || '[]'); } catch (e) { p.pairs = []; }
                        return p;
                    });
                }

                // Fetch discipline records for the student
                const { results: discipline } = await db.prepare(`
                    SELECT * FROM discipline_records 
                    WHERE student_id = ? 
                    ORDER BY date DESC, created_at DESC
                `).bind(studentDbId).all();

                return json({ 
                    student, 
                    attendance, 
                    payments, 
                    examResults,
                    tutes,
                    receivedTuteIds,
                    leaderboard,
                    pairings,
                    discipline
                });
            } catch (e) {
                console.error('Public Portal API Error:', e);
                return json({ error: `Public Portal Sync Error: ${e.message}` }, 500);
            }
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
                    currentUser.role = 'pending'; // Update in-memory so subsequent checks are accurate
                }
            }

            // 2. Allow Trial Users OR Approved Members
            const isTrialActive = currentUser.role === 'trial' && (trialEnd ? trialEnd > now : true);
            
            // Bypass block ONLY for /api/me so user can fetch their profile status
            if (path !== 'me') {
                if (trialEnd && trialEnd < now && !currentUser.is_approved) {
                    return json({ 
                        error: "Trial Expired", 
                        details: "Your 7-day free trial has expired. Please contact admin to activate your account.",
                        isTrialExpired: true 
                    }, 403);
                }
                
                if (!currentUser.is_approved && !isTrialActive) {
                    return json({ 
                        error: "Access Denied", 
                        details: "Your account is pending approval or your trial has ended." 
                    }, 403);
                }
            }
        }

        const logActivity = async (type, desc) => {
            try {
                await db.prepare("INSERT INTO messages (user_id, content, recipient_type, status) VALUES (?, ?, ?, ?)").bind(userId, desc, type, 'Log').run();
            } catch (e) {
                console.error('Log error:', e);
            }
        };

        // Self-heal: add sheets_webhook_url to profiles if not yet present
        try { await db.prepare("ALTER TABLE profiles ADD COLUMN sheets_webhook_url TEXT").run(); } catch(e) {}

        // Helper: fire-and-forget sync to Google Sheets webhook
        const syncToSheets = async (webhookUrl, eventType, payload) => {
            if (!webhookUrl) return;
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event: eventType, timestamp: new Date().toISOString(), data: payload })
                });
            } catch (e) {
                console.error('Google Sheets sync error:', e);
            }
        };

        // Fetch sheets webhook URL for current user (used in multiple handlers below)
        let sheetsWebhookUrl = null;
        try {
            const profileWebhook = await db.prepare("SELECT sheets_webhook_url FROM profiles WHERE id = ?").bind(userId).first();
            sheetsWebhookUrl = profileWebhook?.sheets_webhook_url || null;
        } catch(e) {}

        // ME
        if (path === 'me') {
            if (method === 'GET') {
                try {
                    const user = await db.prepare("SELECT id, email, whatsapp_number, whatsapp_enabled, profile_image_url, role, is_approved, is_email_verified, trial_ends_at, bank_name, account_number, account_holder_name, created_at, card_background_url, card_theme_color, card_layout_type, card_show_visuals FROM profiles WHERE id = ?").bind(userId).first();
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
                // sheets_webhook_url is allowed to be saved via /api/me
                const fields = [];
                const values = [];
                
                const possibleFields = [
                    'whatsapp_number', 'bank_name', 'account_number', 'account_holder_name',
                    'card_background_url', 'card_theme_color', 'card_layout_type', 
                    'card_show_visuals', 'profile_image_url', 'whatsapp_enabled'
                ];

                for (const f of possibleFields) {
                    if (d[f] !== undefined) {
                        fields.push(`${f} = ?`);
                        values.push(d[f]);
                    }
                }

                if (fields.length > 0) {
                    values.push(userId);
                    const sql = `UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`;
                    try {
                        await db.prepare(sql).bind(...values).run();
                    } catch (e) {
                        console.error('Update profile error:', e);
                        // Fallback for missing columns - try updating only basic fields if they exist
                        return json({ error: "Update failed. Database schema might need update." }, 500);
                    }
                }
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
                    if (!sid) return json({ error: "Missing ID" }, 400);

                    // Try searching by primary key (integer) OR student_id (string)
                    let s = null;
                    if (!isNaN(sid)) {
                        s = await db.prepare("SELECT * FROM students WHERE user_id = ? AND (id = ? OR student_id = ?)").bind(userId, sid, sid).first();
                    } else {
                        s = await db.prepare("SELECT * FROM students WHERE user_id = ? AND student_id = ?").bind(userId, sid).first();
                    }

                    if (s) {
                        try { s.subjects = JSON.parse(s.subjects_json || '[]'); } catch (e) { s.subjects = []; }
                        return json(s);
                    }
                    return json({ error: "Student not found in your database" }, 404);
                }
                const classId = url.searchParams.get('class_id');
                const grade = url.searchParams.get('grade');
                const status = url.searchParams.get('status');
                
                let targetGrade = grade;
                let targetSubject = null;
                
                if (classId) {
                    const cls = await db.prepare("SELECT grade, subject_name FROM classes WHERE id = ? AND user_id = ?").bind(classId, userId).first();
                    if (cls) {
                        targetGrade = cls.grade;
                        targetSubject = cls.subject_name;
                    }
                }
                
                let q = "SELECT * FROM students WHERE user_id = ?";
                const p = [userId];
                if (targetGrade) { q += " AND grade = ?"; p.push(targetGrade); }
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
                
                if (targetSubject) {
                    return json(mapped.filter(s => s.subjects && s.subjects.includes(targetSubject)));
                }
                return json(mapped);
            }
            if (method === 'POST') {
                const d = await request.json();
                
                // Bulk reactivation support
                if (subPath === 'bulk-status') {
                    const { ids, status } = d;
                    if (!ids || !Array.isArray(ids) || ids.length === 0) return json({ error: "No student IDs provided" }, 400);
                    const placeholders = ids.map(() => "?").join(",");
                    await db.prepare(`UPDATE students SET status = ? WHERE id IN (${placeholders}) AND user_id = ?`)
                        .bind(status, ...ids, userId).run();
                    return json({ message: `Bulk updated ${ids.length} students to ${status}` });
                }
                
                // Bulk deletion support
                if (subPath === 'bulk-delete') {
                    const { ids } = d;
                    if (!ids || !Array.isArray(ids) || ids.length === 0) return json({ error: "No student IDs provided" }, 400);
                    const placeholders = ids.map(() => "?").join(",");
                    await db.prepare(`DELETE FROM students WHERE id IN (${placeholders}) AND user_id = ?`)
                        .bind(...ids, userId).run();
                    return json({ message: `Bulk deleted ${ids.length} students` });
                }

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
            // Self-heal table schema for recurrence_type
            try { await db.prepare("ALTER TABLE classes ADD COLUMN recurrence_type TEXT DEFAULT 'weekly'").run(); } catch(e) {}

            if (subPath && method === 'GET' && subPath.endsWith('/upcoming')) {
                const classId = subPath.split('/')[0];
                const cls = await db.prepare("SELECT *, COALESCE(recurrence_type, 'weekly') as recurrence_type FROM classes WHERE id = ? AND user_id = ?").bind(classId, userId).first();
                if (!cls) return json({ error: "Class not found" }, 404);

                const daysMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
                const dates = [];
                const now = new Date(Date.now() + 5.5 * 3600000);
                const rec = cls.recurrence_type || 'weekly';

                if (rec === 'none' && cls.class_date) {
                    dates.push(cls.class_date);
                } else {
                    const targetDayIndex = daysMap[cls.day] !== undefined ? daysMap[cls.day] : 0;
                    let current = new Date(now);
                    let daysChecked = 0;
                    while (dates.length < 6 && daysChecked < 90) {
                        if (current.getDay() === targetDayIndex) {
                            const dateStr = current.toISOString().split('T')[0];
                            if (rec === 'weekly') {
                                dates.push(dateStr);
                            } else if (rec === 'biweekly') {
                                if (dates.length === 0 || (daysChecked % 14 === 0)) {
                                    dates.push(dateStr);
                                }
                            } else if (rec === 'monthly') {
                                if (dates.length === 0 || current.getDate() <= 7) {
                                    dates.push(dateStr);
                                }
                            }
                        }
                        current.setDate(current.getDate() + 1);
                        daysChecked++;
                    }
                }
                return json({ class_id: cls.id, recurrence_type: rec, upcoming_dates: dates });
            }

            if (method === 'GET') {
                const grade = url.searchParams.get('grade');
                const status = url.searchParams.get('status');
                
                // Colombo Time for checking past classes
                const now = new Date(Date.now() + 5.5 * 3600000);
                const todayDate = now.toISOString().split('T')[0];

                let q = "SELECT id, name, name as class_name, tutor_name, tutor_name as tutor, subject_name, subject_name as subject, grade, day, class_date, start_time, end_time, fee, status, image_url, color_theme, whatsapp_group_url, COALESCE(recurrence_type, 'weekly') as recurrence_type FROM classes WHERE user_id = ?";
                const p = [userId];
                if (grade) { q += " AND grade = ?"; p.push(grade); }
                if (status) { q += " AND status = ?"; p.push(status); }
                
                const { results } = await db.prepare(q + " ORDER BY created_at DESC").bind(...p).all();
                const mapped = (results || []).map(c => {
                    if (c.recurrence_type === 'none' && c.class_date && c.class_date < todayDate && c.status === 'Active') {
                        return { ...c, status: 'Completed' };
                    }
                    return c;
                });
                return json(mapped);
            }
            if (method === 'POST') {
                const d = await request.json();
                const recType = d.recurrence_type || (d.class_date && !d.day ? 'none' : 'weekly');
                try {
                    await db.prepare("INSERT INTO classes (user_id, name, tutor_name, subject_name, grade, day, class_date, start_time, end_time, fee, status, image_url, color_theme, whatsapp_group_url, recurrence_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                        .bind(userId, d.class_name, d.tutor, d.subject, d.grade, d.day, d.class_date || null, d.start_time, d.end_time, d.fee, d.status || 'Active', d.image_url || null, d.color_theme || null, d.whatsapp_group_url || null, recType).run();
                    await logActivity('class', `Scheduled class ${d.class_name}`);
                    return json({ message: "Added" });
                } catch (e) {
                    console.error('Class Insert Error:', e);
                    return json({ error: e.message }, 500);
                }
            }
            if (method === 'PUT' && subPath) {
                const d = await request.json();
                const recType = d.recurrence_type || (d.class_date && !d.day ? 'none' : 'weekly');
                try {
                    await db.prepare("UPDATE classes SET name = ?, tutor_name = ?, subject_name = ?, grade = ?, day = ?, class_date = ?, start_time = ?, end_time = ?, fee = ?, status = ?, image_url = ?, color_theme = ?, whatsapp_group_url = ?, recurrence_type = ? WHERE id = ? AND user_id = ?")
                        .bind(d.class_name, d.tutor, d.subject, d.grade, d.day, d.class_date || null, d.start_time, d.end_time, d.fee, d.status, d.image_url || null, d.color_theme || null, d.whatsapp_group_url || null, recType, subPath, userId).run();
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
            if (method === 'GET') {
                const limit = url.searchParams.get('limit');
                const sid = url.searchParams.get('student_id');
                let q = `
                    SELECT 
                        p.*, 
                        s.name as student_name, 
                        s.student_id as student_id_str, 
                        c.name as class_name 
                    FROM payments p
                    LEFT JOIN students s ON p.student_id = s.id
                    LEFT JOIN classes c ON p.class_id = c.id
                    WHERE p.user_id = ?
                `;
                const p = [userId];
                if (sid) { q += " AND p.student_id = ?"; p.push(sid); }
                q += " ORDER BY p.payment_date DESC, p.created_at DESC";
                if (limit) { q += " LIMIT ?"; p.push(Number(limit)); }
                
                const { results } = await db.prepare(q).bind(...p).all();
                return json(results || []);
            }

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
                    // Sync to Google Sheets
                    await syncToSheets(sheetsWebhookUrl, 'payment_recorded', { student_id: d.student_id, class_id: d.class_id, amount: d.amount, month: d.month, payment_date: d.payment_date });
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
                // Sync to Google Sheets
                await syncToSheets(sheetsWebhookUrl, 'attendance_saved', { date: records[0]?.date, class_id: records[0]?.class_id, count: records.length });
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
            const now = new Date(Date.now() + 5.5 * 3600000);
            const todayDay = days[now.getUTCDay()];
            const todayDate = now.toISOString().split('T')[0];
            const currentDayOfMonth = now.getUTCDate();

            // Fetch active classes
            const { results } = await db.prepare(`
                SELECT *, COALESCE(recurrence_type, 'weekly') as recurrence_type FROM classes 
                WHERE user_id = ? AND status = 'Active'
                ORDER BY start_time ASC
            `).bind(userId).all();
            
            const todayClasses = (results || []).filter(c => {
                const rec = c.recurrence_type || 'weekly';
                if (rec === 'none') {
                    return c.class_date === todayDate;
                }
                if (rec === 'weekly') {
                    return c.day === todayDay;
                }
                if (rec === 'biweekly') {
                    if (c.day !== todayDay) return false;
                    if (!c.created_at) return true;
                    const createdDate = new Date(c.created_at);
                    const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
                    const diffWeeks = Math.floor(diffDays / 7);
                    return diffWeeks % 2 === 0;
                }
                if (rec === 'monthly') {
                    if (c.class_date) {
                        const targetDate = new Date(c.class_date).getUTCDate();
                        return currentDayOfMonth === targetDate;
                    }
                    return c.day === todayDay && currentDayOfMonth <= 7;
                }
                return c.day === todayDay || c.class_date === todayDate;
            });
            
            return json(todayClasses);
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
            // Self-heal: add certificate_cutoff column if not present
            try { await db.prepare("ALTER TABLE exams ADD COLUMN certificate_cutoff INTEGER DEFAULT 50").run(); } catch(e) {}

            if (method === 'GET') {
                // Fetch exams ordered by date ASC (chronological), include draft counts per exam
                const { results: examRows } = await db.prepare(`
                    SELECT e.*, c.name as class_name,
                        COALESCE(e.certificate_cutoff, 50) as certificate_cutoff,
                        (SELECT COUNT(*) FROM exam_results er WHERE er.exam_id = e.id AND er.tutor_marks IS NOT NULL AND er.tutor_marks > 0) as draft_count
                    FROM exams e 
                    LEFT JOIN classes c ON e.class_id = c.id 
                    WHERE c.user_id = ? 
                    ORDER BY e.date ASC
                `).bind(userId).all();
                return json(examRows || []);
            }
            if (method === 'POST') {
                const d = await request.json();
                const id = crypto.randomUUID();
                await db.prepare("INSERT INTO exams (id, title, class_id, subject_name, date, max_marks, sub_subjects_json, certificate_cutoff) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                    .bind(id, d.title, d.class_id, d.subject_name, d.date, d.max_marks || 100, JSON.stringify(d.sub_subjects || []), d.certificate_cutoff ?? 50).run();
                return json({ message: "Created", id });
            }
            if (method === 'PUT' && subPath) {
                const d = await request.json();
                await db.prepare("UPDATE exams SET title = ?, subject_name = ?, date = ?, max_marks = ?, sub_subjects_json = ?, certificate_cutoff = ? WHERE id = ?")
                    .bind(d.title, d.subject_name, d.date, d.max_marks, JSON.stringify(d.sub_subjects || []), d.certificate_cutoff ?? 50, subPath).run();
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
                
                const mappedResults = (results || []).map(r => {
                    let sub_marks = {};
                    let tutor_sub_marks = {};
                    try { sub_marks = JSON.parse(r.sub_marks_json || '{}'); } catch (e) { sub_marks = {}; }
                    try { tutor_sub_marks = JSON.parse(r.tutor_sub_marks_json || '{}'); } catch (e) { tutor_sub_marks = {}; }
                    return {
                        ...r,
                        sub_marks,
                        tutor_sub_marks
                    };
                });
                return json(mappedResults);
            }
            if (subPath === 'upsert' && method === 'POST') {
                const { exam_id, results } = await request.json();
                const isTeacher = currentUser.role === 'teacher';
                
                for (const r of results) {
                    if (isTeacher) {
                        // Tutor/Teacher logs a draft
                        await db.prepare(`
                            INSERT INTO exam_results (id, exam_id, student_id, marks_obtained, sub_marks_json, tutor_marks, tutor_sub_marks_json, remarks)
                            VALUES (?, ?, ?, 0, '{}', ?, ?, ?)
                            ON CONFLICT(exam_id, student_id) 
                            DO UPDATE SET 
                                tutor_marks = excluded.tutor_marks, 
                                tutor_sub_marks_json = excluded.tutor_sub_marks_json,
                                remarks = CASE WHEN excluded.remarks != '' THEN excluded.remarks ELSE exam_results.remarks END
                        `)
                        .bind(
                            crypto.randomUUID(), 
                            exam_id, 
                            r.student_id, 
                            Number(r.tutor_marks || r.marks_obtained || 0), 
                            JSON.stringify(r.tutor_sub_marks || r.sub_marks || {}), 
                            r.remarks || ''
                        ).run();
                    } else {
                        // Admin/Clerk saves official results
                        await db.prepare(`
                            INSERT INTO exam_results (id, exam_id, student_id, marks_obtained, sub_marks_json, tutor_marks, tutor_sub_marks_json, remarks)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            ON CONFLICT(exam_id, student_id) 
                            DO UPDATE SET 
                                marks_obtained = excluded.marks_obtained, 
                                sub_marks_json = excluded.sub_marks_json,
                                tutor_marks = CASE WHEN excluded.tutor_marks IS NOT NULL AND excluded.tutor_marks > 0 THEN excluded.tutor_marks ELSE exam_results.tutor_marks END,
                                tutor_sub_marks_json = CASE WHEN excluded.tutor_sub_marks_json IS NOT NULL THEN excluded.tutor_sub_marks_json ELSE exam_results.tutor_sub_marks_json END,
                                remarks = excluded.remarks
                        `)
                        .bind(
                            crypto.randomUUID(), 
                            exam_id, 
                            r.student_id, 
                            Number(r.marks_obtained || 0), 
                            JSON.stringify(r.sub_marks || {}),
                            r.tutor_marks ? Number(r.tutor_marks) : null,
                            r.tutor_sub_marks_json || JSON.stringify(r.tutor_sub_marks || {}),
                            r.remarks || ''
                        ).run();
                    }
                }

                // Sync marks to Google Sheets
                const examInfo = await db.prepare("SELECT title, subject_name FROM exams WHERE id = ?").bind(exam_id).first();
                await syncToSheets(sheetsWebhookUrl, 'exam_results_saved', {
                    exam_id,
                    exam_title: examInfo?.title,
                    subject: examInfo?.subject_name,
                    saved_by: isTeacher ? 'tutor_draft' : 'official',
                    student_count: results.length
                });

                return json({ message: "Saved" });
            }
        }

        // MAINTENANCE
        if (path === 'maintenance' && subPath === 'reset' && method === 'POST') {
            const { type } = await request.json();
            
            if (type === 'financial') {
                await db.prepare("DELETE FROM payments WHERE user_id = ?").bind(userId).run();
                await db.prepare("DELETE FROM salary_payments WHERE user_id = ?").bind(userId).run();
                return json({ message: "Financial data reset successfully" });
            } else if (type === 'all') {
                // Delete everything for this user except the profile
                const tables = [
                    'students', 'classes', 'tutors', 'payments', 'attendance', 
                    'exams', 'exam_results', 'staff', 'salary_payments', 
                    'subjects', 'roles', 'messages', 'tutes', 'student_tutes'
                ];
                
                for (const table of tables) {
                    try {
                        await db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).bind(userId).run();
                    } catch (e) {
                        console.error(`Reset error on table ${table}:`, e);
                    }
                }
                return json({ message: "All data reset successfully" });
            }
            return json({ error: "Invalid reset type" }, 400);
        }

        // --- DISCIPLINE MANAGEMENT CRUD ---
        if (path === 'discipline') {
            if (method === 'GET') {
                const studentId = url.searchParams.get('student_id');
                let q = `
                    SELECT d.*, s.name as student_name, s.student_id as student_id_str, s.grade as student_grade 
                    FROM discipline_records d
                    JOIN students s ON d.student_id = s.id
                    WHERE d.user_id = ?
                `;
                const p = [userId];
                if (studentId) {
                    q += " AND d.student_id = ?";
                    p.push(Number(studentId));
                }
                q += " ORDER BY d.date DESC, d.created_at DESC";
                const { results } = await db.prepare(q).bind(...p).all();
                return json(results || []);
            }
            if (method === 'POST') {
                const d = await request.json();
                const id = crypto.randomUUID();
                await db.prepare(`
                    INSERT INTO discipline_records (id, user_id, student_id, type, category, description, date)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `)
                .bind(id, userId, Number(d.student_id), d.type, d.category, d.description, d.date || new Date().toISOString().split('T')[0])
                .run();
                return json({ message: "Discipline record logged", id });
            }
            if (method === 'PUT' && subPath) {
                const d = await request.json();
                await db.prepare(`
                    UPDATE discipline_records 
                    SET student_id = ?, type = ?, category = ?, description = ?, date = ?
                    WHERE id = ? AND user_id = ?
                `)
                .bind(Number(d.student_id), d.type, d.category, d.description, d.date, subPath, userId)
                .run();
                return json({ message: "Discipline record updated" });
            }
            if (method === 'DELETE' && subPath) {
                await db.prepare("DELETE FROM discipline_records WHERE id = ? AND user_id = ?").bind(subPath, userId).run();
                return json({ message: "Discipline record deleted" });
            }
        }

        // --- PAIRINGS SHUFFLER CRUD ---
        if (path === 'pairings') {
            if (method === 'GET') {
                const classId = url.searchParams.get('class_id');
                let q = `
                    SELECT p.*, c.name as class_name, c.grade as class_grade 
                    FROM pairing_sessions p
                    JOIN classes c ON p.class_id = c.id
                    WHERE p.user_id = ?
                `;
                const p = [userId];
                if (classId) {
                    q += " AND p.class_id = ?";
                    p.push(Number(classId));
                }
                q += " ORDER BY p.created_at DESC";
                const { results } = await db.prepare(q).bind(...p).all();
                
                const mappedPairings = (results || []).map(p => {
                    let pairs = [];
                    try { pairs = JSON.parse(p.pairs_json || '[]'); } catch(e) {}
                    return { ...p, pairs };
                });
                return json(mappedPairings);
            }
            if (method === 'POST') {
                const d = await request.json();
                const id = crypto.randomUUID();
                await db.prepare(`
                    INSERT INTO pairing_sessions (id, user_id, class_id, type, team_size, pairs_json)
                    VALUES (?, ?, ?, ?, ?, ?)
                `)
                .bind(id, userId, Number(d.class_id), d.type, Number(d.team_size || 2), JSON.stringify(d.pairs))
                .run();
                return json({ message: "Pairing session saved", id });
            }
            if (method === 'PUT' && subPath) {
                const d = await request.json();
                const isActiveVal = d.is_active === true || d.is_active === 1 ? 1 : 0;
                await db.prepare("UPDATE pairing_sessions SET is_active = ? WHERE id = ? AND user_id = ?")
                    .bind(isActiveVal, subPath, userId)
                    .run();
                return json({ message: "Pairing session updated" });
            }
            if (method === 'DELETE' && subPath) {
                await db.prepare("DELETE FROM pairing_sessions WHERE id = ? AND user_id = ?").bind(subPath, userId).run();
                return json({ message: "Pairing session deleted" });
            }
        }

        return json({ error: "Route not found", path, subPath }, 404);

    } catch (e) {
        console.error('API Error:', e);
        return json({ error: "Server Error", details: e.message }, 500);
    }
}
