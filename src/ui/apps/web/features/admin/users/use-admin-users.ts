"use client";

import type {
  AdminUsersListResult,
  ListAdminUsersParams,
} from "@globalscout/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createBrowserAdminApi } from "@/lib/api/admin-browser";
import {
  adminUsersFiltersMatch,
  adminUsersQueryKeys,
} from "./query-keys";

const adminApi = createBrowserAdminApi();

type UseAdminUsersQueryOptions = {
  initialData?: AdminUsersListResult;
  initialFilters?: ListAdminUsersParams;
};

export function useAdminUsersQuery(
  params: ListAdminUsersParams,
  options: UseAdminUsersQueryOptions = {},
) {
  const useInitialData =
    options.initialData !== undefined &&
    options.initialFilters !== undefined &&
    adminUsersFiltersMatch(params, options.initialFilters);

  return useQuery({
    queryKey: adminUsersQueryKeys.list(params),
    queryFn: () => adminApi.listUsers(params),
    initialData: useInitialData ? options.initialData : undefined,
    staleTime: 0,
    placeholderData: (previous) => previous,
  });
}

export function useAdminUserMutations() {
  const queryClient = useQueryClient();

  async function invalidateUsers() {
    await queryClient.invalidateQueries({
      queryKey: adminUsersQueryKeys.all,
    });
  }

  const updateStatus = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      adminApi.updateUserStatus(userId, status),
    onSuccess: async (_data, variables) => {
      await invalidateUsers();
      toast.success(
        variables.status === "BLOCKED"
          ? "User blocked"
          : "User unblocked",
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: async () => {
      await invalidateUsers();
      toast.success("User deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    updateStatus,
    deleteUser,
    isPending: updateStatus.isPending || deleteUser.isPending,
  };
}
