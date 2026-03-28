"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { loginAsync } from "@/redux/features/authSlice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [tenantcode, setTenantcode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { status, error } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!tenantcode.trim()) {
      setValidationError("Please enter a tenant code");
      return;
    }
    if (!email.includes("@")) {
      setValidationError("Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return;
    }

    const resultAction = await dispatch(loginAsync({ email, password, tenantcode }));

    if (loginAsync.fulfilled.match(resultAction)) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Sign in to your account</h2>
        <p className="mt-2 text-sm text-gray-500">Welcome back! Please enter your details.</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenantcode">Tenant Code</Label>
            <Input
              id="tenantcode"
              type="text"
              placeholder="e.g. OMNI-001"
              value={tenantcode}
              onChange={(e) => setTenantcode(e.target.value)}
              disabled={status === "loading"}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={status === "loading"}
              required
            />
          </div>
        </div>

        {(validationError || error) && (
          <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md">
            {validationError || error}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === "loading" ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
