import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Check for protected routes
  if (!userId && isProtectedRoute(req)) {
    return auth().redirectToSignIn();
  }

  // Check for admin routes
  if (isAdminRoute(req)) {
    const userRole = sessionClaims?.role;
    if (!userRole || (userRole !== "MANAGER" && userRole !== "OPERATIONS")) {
      return new Response("Unauthorized", { status: 403 });
    }
  }
});

export const config = {
  matcher: [
    //Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    //Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
