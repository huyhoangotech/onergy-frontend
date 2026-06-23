"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Khi trang được tải, chuyển hướng đến trang đăng nhập
    router.push("/login");
  }, [router]);

  return null; // Không render gì cả vì người dùng sẽ được chuyển hướng
}