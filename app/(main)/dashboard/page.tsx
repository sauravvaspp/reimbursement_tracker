
import { createClient } from "@/lib/supabase/server";
import AdminReport from "@/components/analytics_dashboard/AdminReport";
import EmployeesReport from "@/components/analytics_dashboard/EmployeesReport";
import ManagerReports from "@/components/analytics_dashboard/ManagerReports";



export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user.id;

  if (!userId) {
    return <p>No active session</p>;
  }

  // const { data: instruments } = await supabase.from("instruments").select();

  const { data: user, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    return <p>Error fetching role: {error.message}</p>;
  }

  const role = user?.role;

  return (
    <>
      {role === "Manager" && <ManagerReports managerID={userId} />}
      {role === "Employee" && <EmployeesReport EmployeesId={userId}/>}
      {(role === "Admin" || role === "Finance") && <AdminReport />}
     
    </>
  );
}
