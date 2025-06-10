"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function BulkActions({ requestIds }: { requestIds: string[] }) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [comments, setComments] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleBulkAction = async () => {
    if (!actionType) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("reimbursement_requests")
        .update({ 
          status: actionType === "approve" ? "Approved" : "Rejected",
          approval_comments: comments || null
        })
        .in("id", requestIds);

      if (error) throw error;

      router.refresh();
      setActionType(null);
      setComments("");
    } catch (error) {
      console.error("Error performing bulk action:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="bg-green-50 text-green-600 hover:bg-green-100"
          onClick={() => setActionType("approve")}
        >
          <Check className="h-4 w-4 mr-2" /> Approve All
        </Button>
        <Button
          variant="outline"
          className="bg-red-50 text-red-600 hover:bg-red-100"
          onClick={() => setActionType("reject")}
        >
          <X className="h-4 w-4 mr-2" /> Reject All
        </Button>
      </div>

      <Dialog open={!!actionType} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve All Requests" : "Reject All Requests"}
            </DialogTitle>
            <DialogDescription>
              This will {actionType} all {requestIds.length} pending requests
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={`Add optional comments for ${actionType === "approve" ? "approval" : "rejection"}`}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              disabled={isLoading}
              className={actionType === "approve" 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-red-600 hover:bg-red-700"}
            >
              {isLoading ? "Processing..." : actionType === "approve" ? "Approve All" : "Reject All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}