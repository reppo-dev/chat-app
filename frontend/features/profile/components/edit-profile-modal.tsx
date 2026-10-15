"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import userApi from "@/lib/api/user.api";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { setEditProfileOpen } from "@/lib/redux/slices/uiSlice";
import { setUser } from "@/lib/redux/slices/authSlice";
import {
  extractNullableString,
  formatDateForInput,
  getApiErrorMessage,
} from "@/lib/utils";

export const EditProfileModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const isOpen = useAppSelector((state) => state.ui.isEditProfileOpen);
  const currentUser = useAppSelector((state) => state.auth.user);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setBio(extractNullableString(currentUser.bio));
      setPhone(extractNullableString(currentUser.phone_number));
      setBirthdate(formatDateForInput(currentUser.birthdate));
    }
  }, [currentUser]);

  const updateMutation = useMutation({
    mutationFn: () =>
      userApi.updateProfile({
        name: name.trim(),
        bio: bio.trim() || null,
        phone_number: phone.trim() || null,
        birthdate: birthdate || null,
      }),
    onSuccess: (res) => {
      const updatedUser = res.data?.data?.user;
      if (updatedUser) {
        dispatch(setUser(updatedUser));
        queryClient.invalidateQueries({ queryKey: ["profile", currentUser?.id] });
      }
      dispatch(setEditProfileOpen(false));
    },
    onError: (err: unknown) => {
      alert(getApiErrorMessage(err, "Failed to update profile"));
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md bg-card p-5 border shadow-xl relative animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={() => dispatch(setEditProfileOpen(false))}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X size={18} />
        </button>

        <h2 className="text-base font-bold mb-4">Edit Profile</h2>

        <div className="flex flex-col gap-3 text-xs mb-4">
          <div>
            <label className="font-semibold block mb-1">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs h-9"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full min-h-[70px] rounded-md border bg-muted/20 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Phone Number</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-xs h-9"
              placeholder="e.g. +1234567890"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Birthdate</label>
            <Input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="text-xs h-9"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(setEditProfileOpen(false))}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!name.trim() || updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>
    </div>
  );
};
