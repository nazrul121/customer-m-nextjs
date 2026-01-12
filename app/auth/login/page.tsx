import { Metadata } from "next";
import LoginContents from "./contents";

export const metadata: Metadata = {
  title: 'Login page',
  description: 'Manage application users and roles.',
};

export default function LoginPage() {
  return (
    <div>
        <LoginContents />
    </div>
  );
}