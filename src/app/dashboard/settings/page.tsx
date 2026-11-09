import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";
import { CreateStaffDialog } from "@/components/create-staff-dialog";
import { UserRowActions } from "@/components/user-row-actions";
import { CategoryFormDialog } from "@/components/category-form-dialog";
import { OfficeFormDialog } from "@/components/office-form-dialog";
import { TeamMemberFormDialog } from "@/components/team-member-form-dialog";
import { BrandingForm } from "@/components/branding-form";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { requireAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteCategory, deleteOffice, deleteTeamMember } from "./actions";

export default async function SettingsPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const [
    { data: users },
    { data: categories },
    { data: offices },
    { data: teamMembers },
    { data: siteSettings },
  ] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at"),
    supabase.from("categories").select("*").order("category_name"),
    supabase.from("offices").select("*").order("office_name"),
    supabase.from("team_members").select("*").order("sort_order"),
    supabase.from("site_settings").select("*").eq("id", true).maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage staff accounts, categories, and offices
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Staff Accounts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="offices">Offices</TabsTrigger>
          <TabsTrigger value="team">Homepage Team</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <CreateStaffDialog />
          </div>
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Role / Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users && users.length > 0 ? (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.full_name ?? "—"}
                          {u.id === profile.id && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <StatusBadge status={u.status} />
                        </TableCell>
                        <TableCell>
                          <UserRowActions
                            userId={u.id}
                            role={u.role}
                            status={u.status}
                            isSelf={u.id === profile.id}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                        No accounts yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <CategoryFormDialog />
          </div>
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories && categories.length > 0 ? (
                    categories.map((c) => (
                      <TableRow key={c.category_id}>
                        <TableCell className="font-medium">
                          {c.category_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {c.description ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DeleteButton
                            action={deleteCategory.bind(null, c.category_id)}
                            confirmMessage={`Delete category "${c.category_name}"?`}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                        No categories yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offices" className="space-y-4">
          <div className="flex justify-end">
            <OfficeFormDialog />
          </div>
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Head</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offices && offices.length > 0 ? (
                    offices.map((o) => (
                      <TableRow key={o.office_id}>
                        <TableCell className="font-medium">{o.office_name}</TableCell>
                        <TableCell>{o.office_head ?? "—"}</TableCell>
                        <TableCell>{o.location ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <DeleteButton
                            action={deleteOffice.bind(null, o.office_id)}
                            confirmMessage={`Delete office "${o.office_name}"?`}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                        No offices yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="flex justify-end">
            <TeamMemberFormDialog nextSortOrder={(teamMembers?.length ?? 0) + 1} />
          </div>
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Year / Course</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers && teamMembers.length > 0 ? (
                    teamMembers.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <PhotoLightbox url={m.photo_url} alt={m.name} shape="square" />
                        </TableCell>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>
                          {m.year_level} &middot; {m.course}
                        </TableCell>
                        <TableCell>{m.email}</TableCell>
                        <TableCell>{m.sort_order}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <TeamMemberFormDialog
                              member={m}
                              nextSortOrder={m.sort_order}
                            />
                            <DeleteButton
                              action={deleteTeamMember.bind(null, m.id)}
                              confirmMessage={`Remove "${m.name}" from the homepage?`}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                        No team members yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardContent className="max-w-md">
              <BrandingForm settings={siteSettings ?? null} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
