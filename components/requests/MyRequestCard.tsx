'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../ui/card';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

type MyRequestCardProps = {
  requestData: any[];
  budget: number;
};

const MyRequestCard: React.FC<MyRequestCardProps> = ({ requestData, budget }) => {
  const router = useRouter();

  let approved = 0;
  let pending = 0;
  let total = 0;
  let approvedC = 0;
  let pendingC = 0;
  let totalC = 0;

  requestData?.forEach((item) => {
    const amount = Number(item.amount) || 0;
    total += amount;
    totalC += 1;

    if (item.status === 'Approved') {
      approved += amount;
      approvedC += 1;
    }

    if (item.status === 'Pending') {
      pending += amount;
      pendingC += 1;
    }
  });

  const remaining = budget - (approved + pending);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">My Reimbursements</h2>
        <Button onClick={() => router.push('/expenses')}>Submit New Expense</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Total Budget</CardTitle>
            <CardDescription>Your total reimbursement budget</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{budget.toFixed(2)}</p>
            <CardDescription>Budget</CardDescription>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Remaining Budget</CardTitle>
            <CardDescription>Budget left after approvals and pending</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">₹{remaining >= 0 ? remaining.toFixed(2) : '0.00'}</p>
            <CardDescription>Remaining Amount</CardDescription>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Total Submitted</CardTitle>
            <CardDescription>All expenses submitted</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{total.toFixed(2)}</p>
            <CardDescription>{totalC} Requests</CardDescription>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Approved</CardTitle>
            <CardDescription>Approved reimbursements</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ₹{approved.toFixed(2)}
            </p>
            <CardDescription>{approvedC} Requests</CardDescription>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Pending</CardTitle>
            <CardDescription>Waiting for approval</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-500">
              ₹{pending.toFixed(2)}
            </p>
            <CardDescription>{pendingC} Requests</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyRequestCard;
