type Role = "REPORTER" | "ADMIN" | "TECHNICIAN" | "FACILITY_MANAGER";
type Status = "SUBMITTED" | "UNDER_REVIEW" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REOPENED";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type User = {
	id: string;
	name: string;
	email: string;
	role: Role;
	reporter_type: string | null;
};

type ReportRow = {
	id: string;
	request_number: string;
	title: string;
	reporter_id: string;
	reporter_name: string | null;
	assigned_technician_id: string | null;
	technician_name: string | null;
	category: string;
	location: string;
	description: string;
	priority: Priority | null;
	status: Status;
	reviewed_by: string | null;
	reviewed_at: string | null;
	assigned_by: string | null;
	assigned_at: string | null;
	resolved_at: string | null;
	closed_by: string | null;
	closed_at: string | null;
	created_at: string;
	updated_at: string;
};

const DEMO_USERS: User[] = [
	{ id: "usr_reporter_001", name: "Pelapor Demo", email: "pelapor@example.edu", role: "REPORTER", reporter_type: "STUDENT" },
	{ id: "usr_admin_001", name: "Administrator Demo", email: "admin@example.edu", role: "ADMIN", reporter_type: null },
	{ id: "usr_technician_001", name: "Teknisi Fasilitas", email: "teknisi.fasilitas@example.edu", role: "TECHNICIAN", reporter_type: null },
	{ id: "usr_technician_002", name: "Teknisi IT", email: "teknisi.it@example.edu", role: "TECHNICIAN", reporter_type: null },
	{ id: "usr_manager_001", name: "Manajer Fasilitas Demo", email: "manager@example.edu", role: "FACILITY_MANAGER", reporter_type: null },
];

function jsonResponse(body: unknown, status = 200) {
	return Response.json(body, {
		status,
		headers: {
			"Cache-Control": "no-store",
			"Content-Type": "application/json",
		},
	});
}

function errorResponse(code: string, message: string, status = 400) {
	return jsonResponse({ error: { code, message } }, status);
}

function nowIso() {
	return new Date().toISOString();
}

function newId(prefix: string) {
	return `${prefix}_${crypto.randomUUID()}`;
}

function requestNumber() {
	const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
	const suffix = Array.from(crypto.getRandomValues(new Uint8Array(3)))
		.map((value) => value.toString(36).padStart(2, "0").slice(-2).toUpperCase())
		.join("");
	return `REQ-${date}-${suffix}`;
}

async function ensureSeedUsers(db: D1Database) {
	for (const user of DEMO_USERS) {
		await db
			.prepare(
				`INSERT OR IGNORE INTO users (id, name, email, role, reporter_type)
				 VALUES (?, ?, ?, ?, ?)`,
			)
			.bind(user.id, user.name, user.email, user.role, user.reporter_type)
			.run();
	}
}

async function currentUser(request: Request, db: D1Database): Promise<User | null> {
	const url = new URL(request.url);
	const id = request.headers.get("X-User-Id") || url.searchParams.get("userId") || "usr_reporter_001";
	return db.prepare("SELECT id, name, email, role, reporter_type FROM users WHERE id = ?").bind(id).first<User>();
}

function canSeeReport(user: User, report: ReportRow) {
	if (user.role === "ADMIN" || user.role === "FACILITY_MANAGER") return true;
	if (user.role === "REPORTER") return report.reporter_id === user.id;
	if (user.role === "TECHNICIAN") return report.assigned_technician_id === user.id;
	return false;
}

function normalizePriority(value: unknown): Priority | null {
	if (typeof value !== "string") return null;
	const priority = value.toUpperCase();
	if (["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) return priority as Priority;
	return null;
}

function buildReportQuery(where: string) {
	return `
		SELECT
			r.*,
			reporter.name AS reporter_name,
			technician.name AS technician_name
		FROM reports r
		LEFT JOIN users reporter ON reporter.id = r.reporter_id
		LEFT JOIN users technician ON technician.id = r.assigned_technician_id
		${where}
	`;
}

async function getReport(db: D1Database, reportId: string) {
	return db.prepare(buildReportQuery("WHERE r.id = ?")).bind(reportId).first<ReportRow>();
}

async function addStatusHistory(
	db: D1Database,
	reportId: string,
	userId: string,
	fromStatus: Status | null,
	toStatus: Status,
	note?: string,
) {
	await db
		.prepare(
			`INSERT INTO report_status_history (id, report_id, changed_by, from_status, to_status, note, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(newId("hist"), reportId, userId, fromStatus, toStatus, note || null, nowIso())
		.run();
}

async function addComment(db: D1Database, reportId: string, userId: string, body: string) {
	if (!body.trim()) return;
	await db
		.prepare(
			`INSERT INTO report_comments (id, report_id, author_id, body, created_at)
			 VALUES (?, ?, ?, ?, ?)`,
		)
		.bind(newId("com"), reportId, userId, body.trim(), nowIso())
		.run();
}

async function updateStatus(db: D1Database, report: ReportRow, user: User, status: Status, note?: string, extraSql = "", extraBindings: unknown[] = []) {
	const timestamp = nowIso();
	await db
		.prepare(`UPDATE reports SET status = ?, updated_at = ? ${extraSql} WHERE id = ?`)
		.bind(status, timestamp, ...extraBindings, report.id)
		.run();
	await addStatusHistory(db, report.id, user.id, report.status, status, note);
	if (note) await addComment(db, report.id, user.id, note);
}

async function listReports(request: Request, db: D1Database, user: User) {
	const url = new URL(request.url);
	const conditions: string[] = [];
	const bindings: string[] = [];

	if (user.role === "REPORTER") {
		conditions.push("r.reporter_id = ?");
		bindings.push(user.id);
	}
	if (user.role === "TECHNICIAN") {
		conditions.push("r.assigned_technician_id = ?");
		bindings.push(user.id);
	}

	const filters = {
		status: url.searchParams.get("status"),
		category: url.searchParams.get("category"),
		priority: url.searchParams.get("priority"),
		location: url.searchParams.get("location"),
		technicianId: url.searchParams.get("technicianId"),
	};

	if (filters.status) {
		conditions.push("r.status = ?");
		bindings.push(filters.status);
	}
	if (filters.category) {
		conditions.push("r.category = ?");
		bindings.push(filters.category);
	}
	if (filters.priority) {
		conditions.push("r.priority = ?");
		bindings.push(filters.priority);
	}
	if (filters.location) {
		conditions.push("r.location LIKE ?");
		bindings.push(`%${filters.location}%`);
	}
	if (filters.technicianId && (user.role === "ADMIN" || user.role === "FACILITY_MANAGER")) {
		conditions.push("r.assigned_technician_id = ?");
		bindings.push(filters.technicianId);
	}

	const q = url.searchParams.get("q");
	if (q) {
		conditions.push("(r.title LIKE ? OR r.description LIKE ? OR r.location LIKE ? OR r.request_number LIKE ?)");
		const like = `%${q}%`;
		bindings.push(like, like, like, like);
	}

	const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
	const { results } = await db
		.prepare(`${buildReportQuery(where)} ORDER BY r.created_at DESC`)
		.bind(...bindings)
		.all<ReportRow>();

	return jsonResponse({ data: results || [] });
}

async function reportDetail(db: D1Database, report: ReportRow) {
	const comments = await db
		.prepare(
			`SELECT c.id, c.report_id AS reportId, c.author_id AS authorId, u.name AS authorName, c.body, c.created_at AS createdAt
			 FROM report_comments c
			 JOIN users u ON u.id = c.author_id
			 WHERE c.report_id = ?
			 ORDER BY c.created_at ASC`,
		)
		.bind(report.id)
		.all();
	const history = await db
		.prepare(
			`SELECT h.id, h.report_id AS reportId, h.changed_by AS changedBy, u.name AS changedByName,
			        h.from_status AS fromStatus, h.to_status AS toStatus, h.note, h.created_at AS createdAt
			 FROM report_status_history h
			 JOIN users u ON u.id = h.changed_by
			 WHERE h.report_id = ?
			 ORDER BY h.created_at ASC`,
		)
		.bind(report.id)
		.all();
	const confirmation = await db
		.prepare(
			`SELECT rc.id, rc.report_id AS reportId, rc.reporter_id AS reporterId, u.name AS reporterName,
			        rc.confirmed, rc.note, rc.created_at AS createdAt
			 FROM report_confirmations rc
			 JOIN users u ON u.id = rc.reporter_id
			 WHERE rc.report_id = ?`,
		)
		.bind(report.id)
		.first();

	return {
		...report,
		comments: comments.results || [],
		statusHistory: history.results || [],
		confirmation: confirmation || null,
	};
}

async function dashboard(db: D1Database) {
	const byStatus = await db.prepare("SELECT status, COUNT(*) AS count FROM reports GROUP BY status").all();
	const byCategory = await db.prepare("SELECT category, COUNT(*) AS count FROM reports GROUP BY category").all();
	const byPriority = await db.prepare("SELECT COALESCE(priority, 'UNSET') AS priority, COUNT(*) AS count FROM reports GROUP BY COALESCE(priority, 'UNSET')").all();
	const openReports = await db
		.prepare(`${buildReportQuery("WHERE r.status != 'CLOSED'")} ORDER BY r.created_at DESC LIMIT 10`)
		.all<ReportRow>();

	return jsonResponse({
		data: {
			byStatus: byStatus.results || [],
			byCategory: byCategory.results || [],
			byPriority: byPriority.results || [],
			openReports: openReports.results || [],
		},
	});
}

async function technicians(db: D1Database) {
	const { results } = await db
		.prepare("SELECT id, name, email, role, reporter_type FROM users WHERE role = 'TECHNICIAN' ORDER BY name")
		.all<User>();
	return jsonResponse({ data: results || [] });
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (!url.pathname.startsWith("/api/")) {
			return new Response(null, { status: 404 });
		}

		try {
			await ensureSeedUsers(env.DB);
			const user = await currentUser(request, env.DB);
			if (!user) return errorResponse("UNAUTHORIZED", "Pengguna tidak ditemukan.", 401);

			if (request.method === "GET" && url.pathname === "/api/users/technicians") {
				return technicians(env.DB);
			}

			if (request.method === "GET" && url.pathname === "/api/dashboard") {
				if (user.role !== "FACILITY_MANAGER" && user.role !== "ADMIN") {
					return errorResponse("FORBIDDEN", "Dashboard hanya untuk Manajer Fasilitas atau Administrator.", 403);
				}
				return dashboard(env.DB);
			}

			if (request.method === "GET" && url.pathname === "/api/reports") {
				return listReports(request, env.DB, user);
			}

			if (request.method === "POST" && url.pathname === "/api/reports") {
				if (user.role !== "REPORTER") return errorResponse("FORBIDDEN", "Hanya Pelapor yang dapat membuat laporan.", 403);
				const body = (await request.json()) as { title?: string; category?: string; location?: string; description?: string };
				if (!body.title?.trim() || !body.category?.trim() || !body.location?.trim() || !body.description?.trim()) {
					return errorResponse("VALIDATION_ERROR", "Judul, kategori, lokasi, dan deskripsi wajib diisi.");
				}
				if (body.description.trim().length < 20) {
					return errorResponse("VALIDATION_ERROR", "Deskripsi minimal 20 karakter.");
				}

				const id = newId("rep");
				const number = requestNumber();
				const timestamp = nowIso();
				await env.DB
					.prepare(
						`INSERT INTO reports
						 (id, request_number, title, reporter_id, category, location, description, priority, status, created_at, updated_at)
						 VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'SUBMITTED', ?, ?)`,
					)
					.bind(id, number, body.title.trim(), user.id, body.category.trim(), body.location.trim(), body.description.trim(), timestamp, timestamp)
					.run();
				await addStatusHistory(env.DB, id, user.id, null, "SUBMITTED", "Laporan dibuat.");
				const created = await getReport(env.DB, id);
				return jsonResponse({ data: created }, 201);
			}

			const detailMatch = url.pathname.match(/^\/api\/reports\/([^/]+)$/);
			if (detailMatch && request.method === "GET") {
				const report = await getReport(env.DB, decodeURIComponent(detailMatch[1]));
				if (!report) return errorResponse("NOT_FOUND", "Laporan tidak ditemukan.", 404);
				if (!canSeeReport(user, report)) return errorResponse("FORBIDDEN", "Anda tidak berhak melihat laporan ini.", 403);
				return jsonResponse({ data: await reportDetail(env.DB, report) });
			}

			const statusHistoryMatch = url.pathname.match(/^\/api\/reports\/([^/]+)\/status-history$/);
			if (statusHistoryMatch && request.method === "GET") {
				const report = await getReport(env.DB, decodeURIComponent(statusHistoryMatch[1]));
				if (!report) return errorResponse("NOT_FOUND", "Laporan tidak ditemukan.", 404);
				if (!canSeeReport(user, report)) return errorResponse("FORBIDDEN", "Anda tidak berhak melihat laporan ini.", 403);
				const history = await env.DB
					.prepare("SELECT * FROM report_status_history WHERE report_id = ? ORDER BY created_at ASC")
					.bind(report.id)
					.all();
				return jsonResponse({ data: history.results || [] });
			}

			const commentsMatch = url.pathname.match(/^\/api\/reports\/([^/]+)\/comments$/);
			if (commentsMatch && request.method === "POST") {
				const report = await getReport(env.DB, decodeURIComponent(commentsMatch[1]));
				if (!report) return errorResponse("NOT_FOUND", "Laporan tidak ditemukan.", 404);
				if (!canSeeReport(user, report)) return errorResponse("FORBIDDEN", "Anda tidak berhak mengomentari laporan ini.", 403);
				const body = (await request.json()) as { body?: string };
				if (!body.body?.trim()) return errorResponse("VALIDATION_ERROR", "Komentar wajib diisi.");
				await addComment(env.DB, report.id, user.id, body.body);
				return jsonResponse({ data: await reportDetail(env.DB, (await getReport(env.DB, report.id)) as ReportRow) }, 201);
			}

			const actionMatch = url.pathname.match(/^\/api\/reports\/([^/]+)\/(review|priority|assignment|work-status|confirmation|close|reopen)$/);
			if (actionMatch) {
				const report = await getReport(env.DB, decodeURIComponent(actionMatch[1]));
				if (!report) return errorResponse("NOT_FOUND", "Laporan tidak ditemukan.", 404);
				const action = actionMatch[2];
				const body = request.method === "PATCH" || request.method === "POST" ? ((await request.json()) as Record<string, unknown>) : {};
				const note = typeof body.note === "string" ? body.note : undefined;

				if (action === "review" && request.method === "PATCH") {
					if (user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Hanya Administrator yang dapat memeriksa laporan.", 403);
					if (report.status !== "SUBMITTED" && report.status !== "REOPENED") return errorResponse("INVALID_STATUS", "Laporan hanya dapat diperiksa dari status Submitted atau Reopened.");
					await updateStatus(env.DB, report, user, "UNDER_REVIEW", note, ", reviewed_by = ?, reviewed_at = ?", [user.id, nowIso()]);
				} else if (action === "priority" && request.method === "PATCH") {
					if (user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Hanya Administrator yang dapat menentukan prioritas.", 403);
					const priority = normalizePriority(body.priority);
					if (!priority) return errorResponse("VALIDATION_ERROR", "Prioritas harus LOW, MEDIUM, HIGH, atau URGENT.");
					await env.DB.prepare("UPDATE reports SET priority = ?, updated_at = ? WHERE id = ?").bind(priority, nowIso(), report.id).run();
					if (note) await addComment(env.DB, report.id, user.id, note);
				} else if (action === "assignment" && request.method === "PATCH") {
					if (user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Hanya Administrator yang dapat menugaskan teknisi.", 403);
					const technicianId = typeof body.technicianId === "string" ? body.technicianId : "";
					const technician = await env.DB.prepare("SELECT id FROM users WHERE id = ? AND role = 'TECHNICIAN'").bind(technicianId).first();
					if (!technician) return errorResponse("VALIDATION_ERROR", "Teknisi tidak valid.");
					const priority = report.priority || normalizePriority(body.priority);
					if (!priority) return errorResponse("VALIDATION_ERROR", "Prioritas harus ditentukan sebelum penugasan.");
					await updateStatus(env.DB, report, user, "ASSIGNED", note, ", priority = ?, assigned_technician_id = ?, assigned_by = ?, assigned_at = ?", [
						priority,
						technicianId,
						user.id,
						nowIso(),
					]);
				} else if (action === "work-status" && request.method === "PATCH") {
					if (user.role !== "TECHNICIAN" || report.assigned_technician_id !== user.id) {
						return errorResponse("FORBIDDEN", "Teknisi hanya dapat memperbarui laporan yang ditugaskan kepadanya.", 403);
					}
					const nextStatus = typeof body.status === "string" ? body.status.toUpperCase() : "";
					if (report.status === "ASSIGNED" && nextStatus === "IN_PROGRESS") {
						await updateStatus(env.DB, report, user, "IN_PROGRESS", note);
					} else if (report.status === "IN_PROGRESS" && nextStatus === "RESOLVED") {
						await updateStatus(env.DB, report, user, "RESOLVED", note, ", resolved_at = ?", [nowIso()]);
					} else {
						return errorResponse("INVALID_STATUS", "Transisi teknisi hanya Assigned -> In Progress -> Resolved.");
					}
				} else if (action === "confirmation" && request.method === "POST") {
					if (user.role !== "REPORTER" || report.reporter_id !== user.id) return errorResponse("FORBIDDEN", "Hanya Pelapor pemilik laporan yang dapat mengonfirmasi.", 403);
					if (report.status !== "RESOLVED") return errorResponse("INVALID_STATUS", "Laporan hanya dapat dikonfirmasi setelah Resolved.");
					await env.DB
						.prepare(
							`INSERT OR REPLACE INTO report_confirmations (id, report_id, reporter_id, confirmed, note, created_at)
							 VALUES (COALESCE((SELECT id FROM report_confirmations WHERE report_id = ?), ?), ?, ?, 1, ?, ?)`,
						)
						.bind(report.id, newId("conf"), report.id, user.id, note || null, nowIso())
						.run();
					if (note) await addComment(env.DB, report.id, user.id, note);
				} else if (action === "close" && request.method === "PATCH") {
					if (user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Hanya Administrator yang dapat menutup laporan.", 403);
					if (report.status !== "RESOLVED") return errorResponse("INVALID_STATUS", "Laporan hanya dapat ditutup dari status Resolved.");
					const confirmation = await env.DB.prepare("SELECT id FROM report_confirmations WHERE report_id = ? AND confirmed = 1").bind(report.id).first();
					if (!confirmation) return errorResponse("VALIDATION_ERROR", "Laporan harus dikonfirmasi Pelapor sebelum ditutup.");
					await updateStatus(env.DB, report, user, "CLOSED", note, ", closed_by = ?, closed_at = ?", [user.id, nowIso()]);
				} else if (action === "reopen" && request.method === "PATCH") {
					if (user.role !== "ADMIN") return errorResponse("FORBIDDEN", "Hanya Administrator yang dapat membuka kembali laporan.", 403);
					if (report.status !== "CLOSED") return errorResponse("INVALID_STATUS", "Hanya laporan Closed yang dapat dibuka kembali.");
					await env.DB.prepare("DELETE FROM report_confirmations WHERE report_id = ?").bind(report.id).run();
					await updateStatus(env.DB, report, user, "REOPENED", note);
				} else {
					return errorResponse("NOT_FOUND", "Endpoint tidak ditemukan.", 404);
				}

				const updated = await getReport(env.DB, report.id);
				return jsonResponse({ data: await reportDetail(env.DB, updated as ReportRow) });
			}

			return errorResponse("NOT_FOUND", "API route not found.", 404);
		} catch (error) {
			console.error("API error:", error);
			return errorResponse("SERVER_ERROR", "Terjadi kesalahan pada server.", 500);
		}
	},
} satisfies ExportedHandler<Env>;
