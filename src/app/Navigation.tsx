"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Route {
  path: string;
  label: string;
}

const routesForAdmin: Route[] = [
  { path: "/", label: "Home" },
  { path: "/sampling", label: "Sampling" },
  { path: "/user", label: "User" },
  { path: "/adduser", label: "Add User" },
  { path: "/merchant", label: "Merchant" },
];

const routesForUser: Route[] = [
  { path: "/", label: "Home" },
  { path: "/user", label: "User" },
  { path: "/sampling", label: "Sampling" },
];


export default function Navigation() {
  const [role, setRole] = useState<"admin" | "user" | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("role") as "admin" | "user" | null;
    setRole(storedRole);
  }, []);

  if (!role) return null; // wait until role is loaded

  const routes = role === "admin" ? routesForAdmin : routesForUser;

  return (
    <nav className="p-4 bg-gray-800 text-white flex gap-4">
      {routes.map((route) => (
        <Link key={route.path} href={route.path} className="hover:underline">
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
