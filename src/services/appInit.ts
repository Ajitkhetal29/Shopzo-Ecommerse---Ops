import axios from "axios";
import { store } from "@/store";
import { setUser, type User } from "@/store/slices/authSlice";
import { setWarehouses } from "@/store/slices/warehouseSlice";
import { setUsers } from "@/store/slices/userSlice";
import { setDashboardStats } from "@/store/slices/dashboardStats";
import { setVendors } from "@/store/slices/vendorSlice";
import { API_ENDPOINTS } from "@/lib/api";
import { setDepartments, setRoles } from "@/store/slices/genralSlice";

export interface AppInitResult {
  success: boolean;
  error?: string;
}

const named = (value: { name?: string } | string | null | undefined): string => {
  if (!value) return "";
  if (typeof value === "string") return value.toLowerCase();
  return (value.name || "").toLowerCase();
};

/** Buyer (or other customer) sessions share the API cookie — not ops users */
export const isOpsEligibleUser = (user: User | null | undefined): boolean => {
  if (!user) return false;
  const role = named(user.role);
  const dept = named(user.department);
  return role !== "buyer" && dept !== "buyer";
};

export const isAdminUser = (user: User | null | undefined): boolean => {
  if (!user) return false;
  return /^(super\s*)?admin$/.test(named(user.role));
};

const logFetchError = (label: string, err: unknown) => {
  const status = axios.isAxiosError(err) ? err.response?.status : undefined;
  const message = axios.isAxiosError(err)
    ? err.response?.data?.message || err.message
    : err instanceof Error
      ? err.message
      : String(err);
  console.warn(`[appInit] ${label}: ${status ?? "?"} ${message}`);
};

/**
 * Initializes app data on startup
 * Fetches current user, warehouses, and users
 */
export const initializeApp = async (): Promise<AppInitResult> => {
  try {
    const dispatch = store.dispatch;
    let state = store.getState();
    let user = state.auth.user;
    let isAuthenticated = Boolean(state.auth.isAuthenticated && user && isOpsEligibleUser(user));

    // First, resolve auth. If not logged in, skip protected startup fetches.
    if (!isAuthenticated) {
      try {
        const res = await axios.get(API_ENDPOINTS.CURRENT_USER, { withCredentials: true });
        if (res.data.success && res.data.user && isOpsEligibleUser(res.data.user)) {
          dispatch(setUser(res.data.user));
          user = res.data.user;
          isAuthenticated = true;
        }
      } catch {
        return { success: true };
      }
    }

    if (!isAuthenticated) {
      return { success: true };
    }

    state = store.getState();
    const admin = isAdminUser(user);

    // Only fetch if data is not already in Redux
    const promises: Promise<unknown>[] = [];

    // Fetch warehouses if not in Redux
    if (!state.warehouse.warehouses || state.warehouse.warehouses.length === 0) {
      promises.push(
        axios
          .get(API_ENDPOINTS.GET_WAREHOUSES, { withCredentials: true })
          .then((res) => {
            if (res.data.success && res.data.warehouses) {
              dispatch(setWarehouses(res.data.warehouses));
            }
          })
          .catch((err) => logFetchError("warehouses", err))
      );
    }

    // Admin-only list endpoints — skip for Manager / TL / etc. to avoid 403 noise
    if (admin) {
      if (!state.user.users || state.user.users.length === 0) {
        promises.push(
          axios
            .get(API_ENDPOINTS.GET_OPS_USERS, { withCredentials: true })
            .then((res) => {
              if (res.status === 200 && res.data.users) {
                dispatch(setUsers(res.data.users));
              }
            })
            .catch((err) => logFetchError("users", err))
        );
      }

      if (!state.vendor.vendors || state.vendor.vendors.length === 0) {
        promises.push(
          axios
            .get(API_ENDPOINTS.GET_VENDORS, { withCredentials: true })
            .then((res) => {
              if (res.data.success && res.data.vendors) {
                dispatch(setVendors(res.data.vendors));
              }
            })
            .catch((err) => logFetchError("vendors", err))
        );
      }

      if (!state.general.departments || state.general.departments.length === 0) {
        promises.push(
          axios
            .get(API_ENDPOINTS.GET_DEPARTMENTS, { withCredentials: true })
            .then((res) => {
              if (res.data.success && res.data.departments) {
                dispatch(setDepartments(res.data.departments));
              }
            })
            .catch((err) => logFetchError("departments", err))
        );
      }

      if (!state.general.roles || state.general.roles.length === 0) {
        promises.push(
          axios
            .get(API_ENDPOINTS.GET_ROLES, { withCredentials: true })
            .then((res) => {
              if (res.data.success && res.data.roles) {
                dispatch(setRoles(res.data.roles));
              }
            })
            .catch((err) => logFetchError("roles", err))
        );
      }
    }

    if (!state.dashboardStats || state.dashboardStats.totalUsers === 0) {
      promises.push(
        axios
          .get(API_ENDPOINTS.GET_DASHBOARD_STATS, { withCredentials: true })
          .then((res) => {
            if (res.data.success && res.data.stats) {
              dispatch(setDashboardStats(res.data.stats));
            }
          })
          .catch((err) => logFetchError("dashboard stats", err))
      );
    }

    await Promise.allSettled(promises);

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to initialize app";
    console.warn("[appInit] fatal:", message);
    return {
      success: false,
      error: message,
    };
  }
};
