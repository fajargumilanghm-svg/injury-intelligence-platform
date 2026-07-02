"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { getAllMessagingUsers, getMessages, sendMessage } from "@/lib/supabase/messages";
import type { Message, UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageCircle, User, Loader2 } from "lucide-react";

interface MessagingUser extends UserProfile {
  user_id: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<MessagingUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<MessagingUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id ?? "";

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser && currentUserId) {
      loadMessages(currentUserId, selectedUser.user_id);
    }
  }, [selectedUser, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadUsers() {
    setIsLoadingUsers(true);
    try {
      const data = await getAllMessagingUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  }

  async function loadMessages(userId: string, partnerId: string) {
    setIsLoadingMessages(true);
    try {
      const data = await getMessages(userId, partnerId);
      setMessages(data);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !selectedUser || !currentUserId || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(currentUserId, selectedUser.user_id, input.trim());
      setInput("");
      await loadMessages(currentUserId, selectedUser.user_id);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const otherUsers = users.filter((u) => u.user_id !== currentUserId);

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-0 rounded-lg border overflow-hidden">
      {/* Left sidebar — users list */}
      <div className="w-1/3 border-r flex flex-col bg-muted/30">
        <div className="p-4 border-b bg-background">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversations
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoadingUsers ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : otherUsers.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No other users found.
            </div>
          ) : (
            otherUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors border-b last:border-b-0 ${
                  selectedUser?.id === u.id ? "bg-muted" : ""
                }`}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={u.avatar_url ?? ""} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {u.full_name ?? u.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.role.replace(/_/g, " ")}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel — chat */}
      <div className="w-2/3 flex flex-col bg-background">
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={selectedUser.avatar_url ?? ""} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {selectedUser.full_name ?? selectedUser.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedUser.role.replace(/_/g, " ")}
                </p>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <Card
                        className={`max-w-[70%] px-4 py-2 ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </Card>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form
              onSubmit={handleSend}
              className="p-4 border-t flex items-center gap-2"
            >
              <Input
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isSending}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isSending || !input.trim()}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <MessageCircle className="mx-auto h-10 w-10" />
              <p className="text-sm">Select a user to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
