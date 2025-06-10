import { createClient } from "@/lib/supabase/server";

// import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
// import ManagerReports from "@/components/analytics_dashboard/ManagerReports";
// import AdminReport from "@/components/analytics_dashboard/AdminReport";
// import EmployeesReport from "@/components/analytics_dashboard/EmployeesReport";
import AdminMonthlyReport from "@/components/monthly_report/AdminMonthlyReport";
import EmployeesMonthlyReport from "@/components/monthly_report/EmployeesMonthlyReport";
import ManagerMonthlyReports from "@/components/monthly_report/ManagerMonthlyReports";



export default async function monthly_report() {
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
      {role === "Manager" && <ManagerMonthlyReports managerID={userId} />}
      {role === "Employee" && <EmployeesMonthlyReport EmployeesId={userId}/>}
      {(role === "Admin" || role === "Finance") && <AdminMonthlyReport />}
     
    </>
  );
}
// import { createClient } from "@/lib/supabase/server";

// export default async function Instruments() {
//   const supabase = await createClient();

//   const {
//     data: { session },
//   } = await supabase.auth.getSession();

//   const { data: instruments } = await supabase.from("instruments").select();

//   return (
//     <>
//       <p>userId = {session?.user.id}</p>
//       <pre>{JSON.stringify(instruments, null, 2)}</pre>
//     </>
//   );
// }