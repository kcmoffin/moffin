import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") || "";
  const isPostman = userAgent.includes("PostmanRuntime");
  const acceptsJson = request.headers.get("accept")?.includes("application/json");

  const backendUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const cleanBackend = backendUrl.replace(/\/+$/, "");

  // 1. If someone calls GET /login in Postman expecting an access token
  if (pathname === "/login" && request.method === "GET" && (isPostman || acceptsJson)) {
    return NextResponse.json(
      {
        error: "Method Not Allowed. To get an access token, use POST (not GET).",
        instruction: "In Postman, change the method from GET to POST.",
        targetUrl: `${cleanBackend}/auth/login`,
        headersNeeded: {
          "Content-Type": "application/json",
        },
        exampleBody: {
          username: "your_username",
          password: "your_password",
        },
      },
      { status: 405 }
    );
  }

  // 2. If someone sends POST to /login on the frontend port
  if (pathname === "/login" && request.method === "POST") {
    try {
      const body = await request.text();
      const res = await fetch(`${cleanBackend}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      const data = await res.text();
      return new NextResponse(data, {
        status: res.status,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          error: `Cannot connect to NestJS backend at ${cleanBackend}. Please make sure your backend is running ('npm run start:dev' in CARRANZA\\Backend).`,
          details: err.message,
        },
        { status: 502 }
      );
    }
  }

  // 3. If someone sends POST to /register on the frontend port
  if (pathname === "/register" && request.method === "POST") {
    try {
      const body = await request.text();
      const res = await fetch(`${cleanBackend}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      const data = await res.text();
      return new NextResponse(data, {
        status: res.status,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          error: `Cannot connect to NestJS backend at ${cleanBackend}. Please make sure your backend is running.`,
          details: err.message,
        },
        { status: 502 }
      );
    }
  }

  // 4. If someone calls /auth/* on the frontend port
  if (pathname.startsWith("/auth/")) {
    try {
      const body = ["POST", "PUT", "PATCH"].includes(request.method)
        ? await request.text()
        : undefined;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const authHeader = request.headers.get("authorization");
      if (authHeader) {
        headers["authorization"] = authHeader;
      }

      const res = await fetch(`${cleanBackend}${pathname}`, {
        method: request.method,
        headers,
        body,
      });

      const data = await res.text();
      return new NextResponse(data, {
        status: res.status,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          error: `Backend unreachable at ${cleanBackend}.`,
          details: err.message,
        },
        { status: 502 }
      );
    }
  }

  // 5. If someone calls /users on the frontend port
  if (pathname === "/users" || pathname.startsWith("/users/")) {
    try {
      const body = ["POST", "PUT", "PATCH"].includes(request.method)
        ? await request.text()
        : undefined;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const authHeader = request.headers.get("authorization");
      if (authHeader) {
        headers["authorization"] = authHeader;
      }

      const res = await fetch(`${cleanBackend}${pathname}`, {
        method: request.method,
        headers,
        body,
      });

      const data = await res.text();
      return new NextResponse(data, {
        status: res.status,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          error: `Backend unreachable at ${cleanBackend}.`,
          details: err.message,
        },
        { status: 502 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/auth/:path*",
    "/users",
    "/users/:path*",
  ],
};
