import { Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OfficerFormDialog } from "@/components/officer-form-dialog";
import { DeleteButton } from "@/components/delete-button";
import { StatusBadge } from "@/components/status-badge";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteOfficer } from "./actions";

export default async function OfficersPage() {
  const profile = await requireUser();
  const supabase = await createClient();

  const [{ data: offices }, { data: officers }] = await Promise.all([
    supabase.from("offices").select("*").order("office_name"),
    supabase
      .from("accountable_officers")
      .select("*, offices(office_name)")
      .order("last_name"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Accountable Officers
          </h1>
          <p className="text-sm text-muted-foreground">
            Personnel responsible for assigned government property
          </p>
        </div>
        <OfficerFormDialog offices={offices ?? []} />
      </div>

      <Card>
        <CardContent>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14"></TableHead>
                  <TableHead>Employee No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead>Contact No.</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {officers && officers.length > 0 ? (
                  officers.map((officer) => (
                    <TableRow key={officer.officer_id}>
                      <TableCell>
                        <PhotoLightbox
                          url={officer.photo_url}
                          alt={`${officer.first_name} ${officer.last_name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {officer.employee_no ?? "—"}
                      </TableCell>
                      <TableCell>
                        {officer.first_name} {officer.last_name}
                      </TableCell>
                      <TableCell>{officer.position ?? "—"}</TableCell>
                      <TableCell>{officer.offices?.office_name ?? "—"}</TableCell>
                      <TableCell>{officer.contact_no ?? "—"}</TableCell>
                      <TableCell>{officer.email ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={officer.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <OfficerFormDialog
                            offices={offices ?? []}
                            officer={officer}
                            trigger={
                              <Button variant="ghost" size="icon-sm">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />
                          {profile.role === "admin" && (
                            <DeleteButton
                              action={deleteOfficer.bind(null, officer.officer_id)}
                              confirmMessage={`Delete officer "${officer.first_name} ${officer.last_name}"? This cannot be undone.`}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No accountable officers registered yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {officers && officers.length > 0 ? (
              officers.map((officer) => (
                <div
                  key={officer.officer_id}
                  className="rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <PhotoLightbox
                        url={officer.photo_url}
                        alt={`${officer.first_name} ${officer.last_name}`}
                      />
                      <div className="min-w-0">
                        <p className="font-medium">
                          {officer.first_name} {officer.last_name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {officer.employee_no ?? "—"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={officer.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Position</p>
                      <p className="font-medium">{officer.position ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Office</p>
                      <p className="font-medium">
                        {officer.offices?.office_name ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contact No.</p>
                      <p className="font-medium">{officer.contact_no ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="truncate font-medium">{officer.email ?? "—"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-1 border-t border-border/60 pt-2">
                    <OfficerFormDialog
                      offices={offices ?? []}
                      officer={officer}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    {profile.role === "admin" && (
                      <DeleteButton
                        action={deleteOfficer.bind(null, officer.officer_id)}
                        confirmMessage={`Delete officer "${officer.first_name} ${officer.last_name}"? This cannot be undone.`}
                      />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No accountable officers registered yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
