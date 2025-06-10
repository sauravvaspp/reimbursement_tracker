"use client";

import { Eye, Check, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/textarea";

export function ComplitedAction({
    requestId,
    status,
    requestDetails,
}: {
    requestId: string;
    status: string;
    requestDetails: {
        id: string;
        employee: string;
        category: string;
        amount: string;
        status: string;
        expenseDate: string;
        description?: string;
        receiptUrl?: string;
        comments?: string;
    };
}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [comments, setComments] = useState(requestDetails.comments || "");
    const [documents, setDocuments] = useState<string[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        if (isDialogOpen) {
            fetchDocuments();
        }
    }, [isDialogOpen]);

    const fetchDocuments = async () => {
        setIsLoadingDocs(true);
        try {
            // First get the user_id from the reimbursement request
            const { data: requestData, error: requestError } = await supabase
                .from("reimbursement_requests")
                .select("user_id")
                .eq("id", requestId)
                .single();

            if (requestError) throw requestError;
            if (!requestData?.user_id) throw new Error("User ID not found");

            // Now fetch documents using the correct path
            const { data: files, error } = await supabase.storage
                .from('docs')
                .list(`${requestData.user_id}/reimbursement_requests/${requestId}`);

            if (error) throw error;

            if (files && files.length > 0) {
                const urls = files.map(file => {
                    const { data: publicUrlData } = supabase.storage
                        .from('docs')
                        .getPublicUrl(`${requestData.user_id}/reimbursement_requests/${requestId}/${file.name}`);
                    return publicUrlData.publicUrl;
                });
                setDocuments(urls);
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setIsLoadingDocs(false);
        }
    };

    const handleStatusUpdate = async (newStatus: "Approved" | "Rejected") => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from("reimbursement_requests")
                .update({
                    status: newStatus,
                    approval_comments: comments || null
                })
                .eq("id", requestId);

            if (error) throw error;

            router.refresh();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error updating request status:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDialogOpen(true)}
                    className="h-8 w-8"
                >
                    <Eye className="h-4 w-4" />
                </Button>

                {status === "Pending" && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusUpdate("Approved")}
                            disabled={isLoading}
                            className="h-8 w-8 text-green-600 hover:text-green-700"
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusUpdate("Rejected")}
                            disabled={isLoading}
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Request Details</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-medium">Request ID</span>
                            <span className="col-span-3">{requestDetails.id}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-medium">Employee</span>
                            <span className="col-span-3">{requestDetails.employee}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-medium">Category</span>
                            <span className="col-span-3">{requestDetails.category}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-medium">Amount</span>
                            <span className="col-span-3">₹{requestDetails.amount}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-medium">Status</span>
                            <span className="col-span-3">{requestDetails.status}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-sm font-medium">Expense Date</span>
                            <span className="col-span-3">{requestDetails.expenseDate}</span>
                        </div>
                        {requestDetails.description && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <span className="text-sm font-medium">Description</span>
                                <span className="col-span-3">{requestDetails.description}</span>
                            </div>
                        )}
                        {documents.length > 0 && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <span className="text-sm font-medium text-gray-600">Documents</span>
                                <div className="col-span-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        {documents.map((docUrl, index) => (
                                            <div key={index} className="flex flex-col p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                                    <span className="text-sm font-medium text-gray-800">
                                                        Receipt uploaded
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 mt-auto w-full"
                                                    asChild
                                                >
                                                    <a
                                                        href={docUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-1"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <span>View</span>
                                                    </a>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {isLoadingDocs && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <span className="text-sm font-medium">Documents</span>
                                <div className="col-span-3 text-sm text-gray-500">Loading documents...</div>
                            </div>
                        )}
                       
                    </div>
                    {status === "Pending" && (
                        <div className="grid grid-cols-4 items-start gap-4">
                        <span className="text-sm font-medium">Comments</span>
                        <div className="col-span-3">
                            <Textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Add approval comments (optional)"
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    )}
                    {status === "Pending" && (
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                variant="destructive"
                                onClick={() => handleStatusUpdate("Rejected")}
                                disabled={isLoading}
                                className="w-full sm:w-auto"
                            >
                                <X className="h-4 w-4 mr-2" /> Reject
                            </Button>
                            <Button
                                onClick={() => handleStatusUpdate("Approved")}
                                disabled={isLoading}
                                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                            >
                                <Check className="h-4 w-4 mr-2" /> Approve
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}