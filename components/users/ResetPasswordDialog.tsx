'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Eye, EyeOff } from 'lucide-react';

// Define password validation schema
const passwordSchema = z.object({
    password: z.string().superRefine((val, ctx) => {
        if (val.length < 8) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Password must be at least 8 characters",
            });
        }
        if (!/[A-Z]/.test(val)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Password must include at least one uppercase letter",
            });
        }
        if (!/\d/.test(val)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Password must include at least one number",
            });
        }
        if (!/[^A-Za-z0-9]/.test(val)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Password must include at least one special character",
            });
        }
    }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type FormValues = z.infer<typeof passwordSchema>;

interface ResetPasswordDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onReset: (newPassword: string) => Promise<void>;
}

export function ResetPasswordDialog({ isOpen, setIsOpen, onReset }: ResetPasswordDialogProps) {
    const [loading, setLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    const handleSubmit = async (values: FormValues) => {
        setLoading(true);
        try {
            await onReset(values.password);
            setIsOpen(false);
            form.reset();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        Enter a new password for this user.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <div className="relative">
                                        <FormControl>
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="New Password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <div className="relative">
                                        <FormControl>
                                            <Input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm Password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Resetting..." : "Reset Password"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}