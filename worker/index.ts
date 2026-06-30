type ServiceRequest = {
	id: string;
	request_number: string;
	title: string;
	description: string;
	location: string;
	category: string;
	priority: string | null;
	status: string | null;
	created_at: string | null;
};

function jsonResponse(body: unknown, status = 200) {
	return Response.json(body, {
		status,
		headers: {
			"Cache-Control": "no-store",
		},
	});
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const requestDetailMatch = url.pathname.match(/^\/api\/requests\/([^/]+)$/);

		if (request.method === "GET" && requestDetailMatch) {
			const id = decodeURIComponent(requestDetailMatch[1]);
			const serviceRequest = await env.DB.prepare(
				`SELECT id, request_number, title, description, location, category, priority, status, created_at
				 FROM service_requests
				 WHERE id = ?`,
			)
				.bind(id)
				.first<ServiceRequest>();

			if (!serviceRequest) {
				return jsonResponse({ error: "Service request not found" }, 404);
			}

			return jsonResponse({ request: serviceRequest });
		}

		if (url.pathname.startsWith("/api/")) {
			return jsonResponse({ error: "API route not found" }, 404);
		}

		return new Response(null, { status: 404 });
	},
} satisfies ExportedHandler<Env>;
