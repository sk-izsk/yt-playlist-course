import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in · Tubewise" };

const LoginPage = () => <LoginForm />;

export default LoginPage;
