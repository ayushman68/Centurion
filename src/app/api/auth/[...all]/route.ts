import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { protectAuthPost } from "@/lib/auth-handler";
const handlers = toNextJsHandler(auth);
export const GET = handlers.GET;
export const POST = protectAuthPost(handlers.POST, process.env.BETTER_AUTH_URL);
