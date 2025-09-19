import accountApiRequest from "@/apiRequests/account";
import { cookies } from "next/headers";

const Dashboard = async () => {
  const cookiStore = await cookies();
  const accessToken = cookiStore.get("accessToken")?.value!;
  let name = "";
  try {
    const result = await accountApiRequest.sMe(accessToken);
    name = result.payload.data.name;
  } catch (error: any) {
    if (error.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
  }

  return <div>Dashboard</div>;
};

export default Dashboard;
