"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, Check } from "lucide-react";
import type { AdminUser } from "@/lib/data/admin";

const ROLE_TONES: Record<string, "verified" | "featured" | "new" | "neutral"> = {
  admin: "featured",
  dealer: "new",
  buyer: "neutral",
  b2b_importer: "verified",
};
const ROLES = ["buyer", "dealer", "b2b_importer", "admin"];

export function UsersTable({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [roles, setRoles] = useState<Record<string, string>>({});

  const filtered = users.filter(
    (u) =>
      !q ||
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()),
  );

  const changeRole = async (id: string, role: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      setRoles((r) => ({ ...r, [id]: role }));
      toast.success(`Role updated to ${role}`);
      router.refresh();
    } catch {
      toast.error("Update failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 h-8 w-80 rounded-sm bg-[#161616] border border-white/10 px-4 text-xs">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 bg-transparent outline-none text-white placeholder:text-muted"
          />
        </div>
      </div>

      <div className="rounded bg-[#161616] border border-white/8 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-[#121212] text-[10px] uppercase tracking-widest text-muted">
            <tr>
              <th className="text-start p-4 font-medium">User</th>
              <th className="text-start p-4 font-medium hidden md:table-cell">Email</th>
              <th className="text-start p-4 font-medium">Role</th>
              <th className="text-start p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const role = roles[u.id] ?? u.role;
              return (
                <tr key={u.id} className={`border-t border-white/5 hover:bg-white/[0.02] ${busy === u.id ? "opacity-50" : ""}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#1A1A1A] flex items-center justify-center text-xs font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-xs">{u.name}</div>
                        <div className="text-xs text-muted">{u.id.slice(0, 10)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell text-xs text-secondary">{u.email}</td>
                  <td className="p-4">
                    <Badge tone={ROLE_TONES[role] ?? "neutral"}>{role.toUpperCase()}</Badge>
                  </td>
                  <td className="p-4">
                    <Dropdown.Root>
                      <Dropdown.Trigger asChild>
                        <button className="inline-flex items-center gap-1 text-xs text-secondary hover:text-white">
                          Edit role <ChevronDown className="h-3 w-3" />
                        </button>
                      </Dropdown.Trigger>
                      <Dropdown.Portal>
                        <Dropdown.Content
                          align="end"
                          className="z-50 min-w-[150px] rounded-md bg-[#161616] border border-white/10 p-1 shadow-xl text-xs"
                        >
                          {ROLES.map((r) => (
                            <Dropdown.Item
                              key={r}
                              onClick={() => changeRole(u.id, r)}
                              className="flex items-center justify-between px-2.5 py-2 rounded-sm cursor-pointer outline-none text-secondary data-[highlighted]:bg-white/5 capitalize"
                            >
                              {r.replace("_", " ")}
                              {role === r && <Check className="h-3 w-3 text-[#F0CE5C]" />}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Content>
                      </Dropdown.Portal>
                    </Dropdown.Root>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
