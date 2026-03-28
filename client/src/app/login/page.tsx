import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 items-center flex justify-center">
        {/* Placeholder for Logo */}
        <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-xl">ID</span>
        </div>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center">
        <LoginForm />
      </div>
    </div>
  );
}
