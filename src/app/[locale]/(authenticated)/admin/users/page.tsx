import { DashboardHeader } from "@/components/dashboard/header";
import { UsersTable } from "@/components/admin/users-table";
import { getAdminUsers } from "@/lib/data/admin";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();
  const dealers = users.filter((u) => u.role === "dealer").length;
  const staff = users.filter((u) => u.role === "admin").length;

  return (
    <>
      <DashboardHeader
        title="Users"
        subtitle={`${users.length} total · ${staff} staff · ${dealers} dealers`}
      />
      <UsersTable users={users} />
    </>
  );
}
