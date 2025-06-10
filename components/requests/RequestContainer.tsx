'use client';

import { useEffect, useState } from 'react';
import MyRequestCard from "@/components/requests/MyRequestCard";
import MyRequestTable from "@/components/requests/MyRequestTable";
import { useRouter } from "next/navigation";
import { fetchRequestData, updateRequest, deleteRequest } from '@/lib/requests/action';

export default function RequestContainer({ userId }: { userId: string | null }) {
  const router = useRouter();
  const [requestData, setRequestData] = useState<any[]>([]);
  const [budget, setBudget] = useState<number>(0);

  const fetchData = async () => {
    const { data, budget } = await fetchRequestData(userId);
    if (data) setRequestData(data);
    setBudget(budget);
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleUpdateRequest = async (updatedData: any) => {
    const { error } = await updateRequest(updatedData);
    
    if (error) {
      console.error('Error updating request:', error.message);
      return false;
    }

    await fetchData(); 
    router.refresh(); 
    return true;
  };

  const handleDeleteRequest = async (requestId: string) => {
    const { error } = await deleteRequest(requestId);
    
    if (error) {
      console.error('Error deleting request:', error.message);
      return false;
    }

    await fetchData();
    router.refresh();
    return true;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Requests</h1>
        <p className="text-muted-foreground">Track all your expense submissions and their status</p>
      </div>
      <div className="mb-6">
        <MyRequestCard requestData={requestData} budget={budget} />
      </div>
      <div className="mb-6">
        <MyRequestTable 
          userId={userId}
          onUpdateRequest={handleUpdateRequest}
          onDeleteRequest={handleDeleteRequest}
        />
      </div>
    </div>
  );
}