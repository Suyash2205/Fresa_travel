"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/",
    });
    if (result?.error) {
      setError("Invalid credentials");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="login-email" className="block text-sm font-medium text-[#262626]">
          Email
        </label>
        <input
          id="login-email"
          className="w-full rounded-md border border-[#e7bba8] bg-white px-3 py-2 text-[#1d1d1d] placeholder:text-[#7a7a7a] focus:border-[#fd8756] focus:outline-none"
          placeholder="agent@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="login-password" className="block text-sm font-medium text-[#262626]">
          Password
        </label>
        <input
          id="login-password"
          className="w-full rounded-md border border-[#e7bba8] bg-white px-3 py-2 text-[#1d1d1d] placeholder:text-[#7a7a7a] focus:border-[#fd8756] focus:outline-none"
          placeholder="Enter your password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error ? <p className="text-sm font-medium text-[#b42318]">{error}</p> : null}
      <button
        type="submit"
        className="w-full rounded-md bg-[#fd8756] px-3 py-2 font-medium text-white hover:bg-[#ea6f3e]"
      >
        Sign in
      </button>
    </form>
  );
}
