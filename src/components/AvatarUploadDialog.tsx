import React, { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, Loader2, User, Check, X, Eye, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface AvatarUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    canEdit?: boolean;
}

type DialogView = "options" | "upload" | "view";

export function AvatarUploadDialog({ open, onOpenChange, canEdit = true }: AvatarUploadDialogProps) {
    const { user, token, updateUser } = useAuth();
    const [view, setView] = useState<DialogView>("options");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                return;
            }
            if (!file.type.startsWith("image/")) {
                toast.error("Please select an image file");
                return;
            }
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
                setView("upload");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !token) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("avatar", selectedFile);

        try {
            const response = await axios.post("http://127.0.0.1:3001/api/upload-avatar", formData, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.avatar_url) {
                updateUser({ ...user!, avatar_url: response.data.avatar_url });
                toast.success("Profile picture updated!");
                handleClose();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!token) return;
        setIsDeleting(true);
        try {
            await axios.delete("http://127.0.0.1:3001/api/delete-avatar", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            updateUser({ ...user!, avatar_url: undefined });
            toast.success("Profile picture removed");
            handleClose();
        } catch (error) {
            toast.error("Failed to delete image");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setView("options");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange(val); }}>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 p-0 overflow-hidden rounded-3xl animate-in fade-in zoom-in-95 duration-200">
                {view === "options" && (
                    <div className="p-6 space-y-6">
                        <div className="text-center space-y-1">
                            <DialogTitle className="text-xl font-bold tracking-tight">Profile Photo</DialogTitle>
                            <DialogDescription className="text-zinc-400">Manage your profile picture</DialogDescription>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {canEdit && (
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="outline"
                                    className="h-14 rounded-2xl justify-start px-6 border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <span className="font-semibold">Choose Photo</span>
                                </Button>
                            )}

                            {user?.avatar_url && (
                                <Button
                                    onClick={() => setView("view")}
                                    variant="outline"
                                    className="h-14 rounded-2xl justify-start px-6 border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                        <Eye className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <span className="font-semibold">View Photo</span>
                                </Button>
                            )}

                            {canEdit && user?.avatar_url && (
                                <Button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    variant="outline"
                                    className="h-14 rounded-2xl justify-start px-6 border-white/5 bg-white/5 hover:bg-red-500/10 hover:border-red-500/10 hover:text-red-500 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4 text-red-500" />}
                                    </div>
                                    <span className="font-semibold">Delete Photo</span>
                                </Button>
                            )}

                            {!canEdit && !user?.avatar_url && (
                                <p className="text-center py-4 text-zinc-500 text-sm">No photo to view. Click "Edit Profile" to add one.</p>
                            )}
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                )}

                {view === "upload" && (
                    <div className="p-6 space-y-6">
                        <div className="text-center space-y-1">
                            <DialogTitle className="text-xl font-bold tracking-tight">Preview</DialogTitle>
                            <DialogDescription className="text-zinc-400">Does this look good?</DialogDescription>
                        </div>

                        <div className="flex justify-center py-4">
                            <Avatar className="w-40 h-40 border-4 border-primary/20 shadow-2xl">
                                <AvatarImage src={previewUrl || ""} />
                            </Avatar>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="flex-1 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <> <Check className="w-4 h-4 mr-2" /> Update Picture </>}
                            </Button>
                            <Button
                                onClick={() => setView("options")}
                                variant="outline"
                                className="h-12 w-12 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {view === "view" && (
                    <div className="p-0 relative group">
                        <DialogTitle className="sr-only">Profile Picture View</DialogTitle>
                        <img
                            src={user?.avatar_url}
                            alt="Profile"
                            className="w-full aspect-square object-cover"
                        />
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                onClick={() => setView("options")}
                                size="icon"
                                variant="secondary"
                                className="rounded-full bg-black/60 backdrop-blur-md border-white/10 hover:bg-black/80"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-4 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white font-bold text-center">{user?.username}</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
