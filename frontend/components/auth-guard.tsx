"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { logout, setCredentials, setUser } from "@/lib/redux/slices/authSlice";
import authApi from "@/lib/api/auth.api";
import { getStoredToken } from "@/lib/api";

const PUBLIC_ROUTES = ["/login", "/signup"];

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const storedToken = getStoredToken();

      if (storedToken) {
        try {
          const res = await authApi.getCurrentUser();
          if (mounted && res.data?.data?.user) {
            dispatch(
              setCredentials({
                user: res.data.data.user,
                token: storedToken,
              })
            );
          }
        } catch {
          // Token might be expired, try refreshing
          try {
            const refreshRes = await authApi.refreshSession();
            const newToken = refreshRes.data?.data?.access_token;
            if (newToken) {
              const userRes = await authApi.getCurrentUser();
              if (mounted) {
                dispatch(
                  setCredentials({
                    user: userRes.data?.data?.user,
                    token: newToken,
                  })
                );
              }
            } else {
              if (mounted) dispatch(logout());
            }
          } catch {
            if (mounted) dispatch(logout());
          }
        }
      } else {
        // Try silent refresh using HTTP-only cookie
        try {
          const refreshRes = await authApi.refreshSession();
          const newToken = refreshRes.data?.data?.access_token;
          if (newToken) {
            const userRes = await authApi.getCurrentUser();
            if (mounted) {
              dispatch(
                setCredentials({
                  user: userRes.data?.data?.user,
                  token: newToken,
                })
              );
            }
          } else {
            if (mounted) dispatch(logout());
          }
        } catch {
          if (mounted) dispatch(logout());
        }
      }

      if (mounted) {
        setIsHydrating(false);
      }
    };

    checkAuth();

    // Listen to global logout event from axios interceptor
    const handleGlobalLogout = () => {
      dispatch(logout());
      if (!PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
        router.push("/login");
      }
    };

    window.addEventListener("auth:logout", handleGlobalLogout);

    return () => {
      mounted = false;
      window.removeEventListener("auth:logout", handleGlobalLogout);
    };
  }, [dispatch, router]);

  useEffect(() => {
    if (!isHydrating) {
      const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
      if (!isAuthenticated && !isPublic) {
        router.push("/login");
      } else if (isAuthenticated && isPublic) {
        router.push("/");
      }
    }
  }, [isHydrating, isAuthenticated, pathname, router]);

  if (isHydrating || (isLoading && !PUBLIC_ROUTES.includes(pathname))) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading application...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
