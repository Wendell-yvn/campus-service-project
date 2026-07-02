type ServiceRequest = {
	id: string;
	request_number: string;
	title: string;
	description: string;
	location: string;
	category: string;
	priority: string | null;
	status: string | null;
	assigned_technician: string | null;
	created_at: string | null;
};

function jsonResponse(body: unknown, status = 200) {
	return Response.json(body, {
		status,
		headers: {
			"Cache-Control": "no-store",
			"Content-Type": "application/json",
		},
	});
}

function isValidTransition(current: string, next: string): boolean {
	const currentUpper = current.toUpperCase();
	const nextUpper = next.toUpperCase();

	if (currentUpper === nextUpper) return true;

	// CLOSED is a terminal state
	if (currentUpper === "CLOSED") return false;

	switch (currentUpper) {
		case "SUBMITTED":
			return nextUpper === "ASSIGNED" || nextUpper === "CLOSED";
		case "ASSIGNED":
			return nextUpper === "IN_PROGRESS" || nextUpper === "RESOLVED" || nextUpper === "CLOSED";
		case "IN_PROGRESS":
			return nextUpper === "RESOLVED" || nextUpper === "CLOSED";
		case "RESOLVED":
			return nextUpper === "CLOSED";
		default:
			return false;
	}
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		// Route: GET /api/requests (List requests with filters)
		if (request.method === "GET" && url.pathname === "/api/requests") {
			try {
				const statusParam = url.searchParams.get("status");
				const priorityParam = url.searchParams.get("priority");
				const categoryParam = url.searchParams.get("category");
				const searchQuery = url.searchParams.get("q");

				let query = `
					SELECT id, request_number, title, description, location, category, priority, status, assigned_technician, created_at
					FROM service_requests
				`;
				const conditions: string[] = [];
				const bindings: string[] = [];

				if (statusParam) {
					conditions.push("status = ?");
					bindings.push(statusParam);
				}
				if (priorityParam) {
					conditions.push("priority = ?");
					bindings.push(priorityParam);
				}
				if (categoryParam) {
					conditions.push("category = ?");
					bindings.push(categoryParam);
				}
				if (searchQuery) {
					conditions.push("(title LIKE ? OR description LIKE ? OR location LIKE ? OR request_number LIKE ?)");
					const likeVal = `%${searchQuery}%`;
					bindings.push(likeVal, likeVal, likeVal, likeVal);
				}

				if (conditions.length > 0) {
					query += " WHERE " + conditions.join(" AND ");
				}

				query += " ORDER BY created_at DESC";

				const stmt = env.DB.prepare(query).bind(...bindings);
				const { results } = await stmt.all<ServiceRequest>();

				return jsonResponse({ requests: results || [] });
			} catch (error) {
				console.error("GET /api/requests error:", error);
				return jsonResponse({ error: "Gagal memuat daftar laporan." }, 500);
			}
		}

		// Route: GET /api/requests/:id (Detail request)
		const requestDetailMatch = url.pathname.match(/^\/api\/requests\/([^/]+)$/);
		if (request.method === "GET" && requestDetailMatch) {
			try {
				const id = decodeURIComponent(requestDetailMatch[1]);
				const serviceRequest = await env.DB.prepare(
					`SELECT id, request_number, title, description, location, category, priority, status, assigned_technician, created_at
					 FROM service_requests
					 WHERE id = ?`,
				)
					.bind(id)
					.first<ServiceRequest>();

				if (!serviceRequest) {
					return jsonResponse({ error: "Laporan tidak ditemukan." }, 404);
				}

				return jsonResponse({ request: serviceRequest });
			} catch (error) {
				console.error("GET /api/requests/:id error:", error);
				return jsonResponse({ error: "Gagal memuat detail laporan." }, 500);
			}
		}

		// Route: POST /api/requests (Create request)
		if (request.method === "POST" && url.pathname === "/api/requests") {
			try {
				const body = (await request.json()) as Partial<ServiceRequest>;
				const { title, description, location, category } = body;

				// Validation
				if (!title?.trim() || !description?.trim() || !location?.trim() || !category?.trim()) {
					return jsonResponse({ error: "Semua field wajib (judul, deskripsi, lokasi, kategori) harus diisi." }, 400);
				}

				const id = crypto.randomUUID();

				// Generate request number: REQ-YYYYMMDD-XXXX (4 random uppercase chars)
				const now = new Date();
				const yyyy = now.getFullYear();
				const mm = String(now.getMonth() + 1).padStart(2, '0');
				const dd = String(now.getDate()).padStart(2, '0');
				const randomChars = Array.from({ length: 4 }, () => 
					String.fromCharCode(65 + Math.floor(Math.random() * 26))
				).join('');
				const request_number = `REQ-${yyyy}${mm}${dd}-${randomChars}`;

				const priority = body.priority || "MEDIUM";
				const status = "SUBMITTED";

				await env.DB.prepare(
					`INSERT INTO service_requests (id, request_number, title, description, location, category, priority, status, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
				)
					.bind(id, request_number, title.trim(), description.trim(), location.trim(), category.trim(), priority, status)
					.run();

				const newRequest = await env.DB.prepare(
					`SELECT id, request_number, title, description, location, category, priority, status, assigned_technician, created_at
					 FROM service_requests
					 WHERE id = ?`
				)
					.bind(id)
					.first<ServiceRequest>();

				return jsonResponse({ request: newRequest }, 201);
			} catch (error) {
				console.error("POST /api/requests error:", error);
				return jsonResponse({ error: "Gagal membuat laporan baru." }, 500);
			}
		}

		// Route: PATCH /api/requests/:id (Update request)
		if (request.method === "PATCH" && requestDetailMatch) {
			try {
				const id = decodeURIComponent(requestDetailMatch[1]);
				const body = (await request.json()) as Partial<ServiceRequest>;

				// Fetch existing
				const existing = await env.DB.prepare(
					`SELECT id, status, priority, category, assigned_technician FROM service_requests WHERE id = ?`
				)
					.bind(id)
					.first<ServiceRequest>();

				if (!existing) {
					return jsonResponse({ error: "Laporan tidak ditemukan." }, 404);
				}

				// Build updates dynamically
				const updates: string[] = [];
				const bindings: (string | null)[] = [];

				// Check priority update
				if (body.priority !== undefined) {
					updates.push("priority = ?");
					bindings.push(body.priority);
				}

				// Check category update
				if (body.category !== undefined) {
					updates.push("category = ?");
					bindings.push(body.category);
				}

				// Check assigned_technician update
				let newTechnician = existing.assigned_technician;
				if (body.assigned_technician !== undefined) {
					updates.push("assigned_technician = ?");
					bindings.push(body.assigned_technician);
					newTechnician = body.assigned_technician;
				}

				// Check status transition
				let targetStatus = body.status;
				
				// Auto-transition from SUBMITTED to ASSIGNED if a technician is being assigned
				if (
					existing.status === "SUBMITTED" && 
					newTechnician && 
					!targetStatus
				) {
					targetStatus = "ASSIGNED";
				}

				if (targetStatus !== undefined && targetStatus !== null) {
					const currentStatus = existing.status || "SUBMITTED";
					if (!isValidTransition(currentStatus, targetStatus)) {
						return jsonResponse({ 
							error: `Transisi status tidak valid dari ${currentStatus} ke ${targetStatus}.` 
						}, 400);
					}
					updates.push("status = ?");
					bindings.push(targetStatus);
				}

				if (updates.length === 0) {
					return jsonResponse({ error: "Tidak ada data yang diperbarui." }, 400);
				}

				bindings.push(id);
				await env.DB.prepare(
					`UPDATE service_requests SET ${updates.join(", ")} WHERE id = ?`
				)
					.bind(...bindings)
					.run();

				const updatedRequest = await env.DB.prepare(
					`SELECT id, request_number, title, description, location, category, priority, status, assigned_technician, created_at
					 FROM service_requests
					 WHERE id = ?`
				)
					.bind(id)
					.first<ServiceRequest>();

				return jsonResponse({ request: updatedRequest });
			} catch (error: unknown) {
				console.error("PATCH /api/requests/:id error:", error);
				const msg = error instanceof Error ? error.message : "Unknown error";
				return jsonResponse({ error: `Gagal memperbarui laporan: ${msg}` }, 500);
			}
		}

		if (url.pathname.startsWith("/api/")) {
			return jsonResponse({ error: "API route not found." }, 404);
		}

		return new Response(null, { status: 404 });
	},
} satisfies ExportedHandler<Env>;
