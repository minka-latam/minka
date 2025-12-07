"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

interface Comment {
  id: string;
  message: string;
  createdAt: string;
  profile: {
    id: string;
    name: string;
    profilePicture?: string | null;
  };
}

interface CampaignCommentsProps {
  campaignId: string;
  organizerId?: string;
}

export function CampaignComments({
  campaignId,
  organizerId,
}: CampaignCommentsProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Fetch comments on mount
  useEffect(() => {
    fetchComments();
  }, [campaignId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/campaign/${campaignId}/comments`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      const data = await response.json();
      setComments(data.comments || []);
      setHasMore(data.hasMore || false);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los comentarios",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "El comentario no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/campaign/${campaignId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to post comment");
      }

      const newCommentData = await response.json();

      // Add the new comment to the beginning of the list
      setComments((prev) => [newCommentData, ...prev]);
      setTotal((prev) => prev + 1);
      setNewComment("");

      toast({
        title: "Comentario publicado",
        description: "Tu comentario ha sido publicado exitosamente",
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo publicar el comentario",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/campaign/${campaignId}/comments?commentId=${commentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete comment");
      }

      // Remove the comment from the list
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotal((prev) => prev - 1);

      toast({
        title: "Comentario eliminado",
        description: "El comentario ha sido eliminado",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el comentario",
        variant: "destructive",
      });
    }
  };

  const canDeleteComment = (comment: Comment) => {
    if (!profile) return false;
    // User can delete if they are the comment author or the campaign organizer
    return comment.profile.id === profile.id || profile.id === organizerId;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes <= 1 ? "hace un momento" : `hace ${diffMinutes} minutos`;
      }
      return diffHours === 1 ? "hace 1 hora" : `hace ${diffHours} horas`;
    }
    if (diffDays === 1) return "hace 1 día";
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? "hace 1 semana" : `hace ${weeks} semanas`;
    }
    return date.toLocaleDateString("es-BO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl md:text-4xl font-semibold text-[#2c6e49] break-words">
          Comentarios
        </h2>
        {total > 0 && (
          <span className="text-gray-500 text-sm">
            {total} {total === 1 ? "comentario" : "comentarios"}
          </span>
        )}
      </div>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage
                src={profile?.profile_picture || undefined}
                alt={profile?.name || "Usuario"}
              />
              <AvatarFallback className="bg-[#e8f0e9] text-[#2c6e49]">
                {profile?.name ? getInitials(profile.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario de apoyo..."
                className="min-h-[100px] resize-none border-gray-300 focus:border-[#2c6e49] focus:ring-[#2c6e49]"
                disabled={isSubmitting}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Publicar comentario
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-[#f5f7e9] rounded-lg p-6 text-center">
          <MessageCircle className="h-10 w-10 text-[#2c6e49] mx-auto mb-3" />
          <p className="text-gray-700 mb-4">
            Inicia sesión para dejar un comentario de apoyo
          </p>
          <Link href={`/sign-in?returnUrl=/campaign/${campaignId}`}>
            <Button className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white">
              Iniciar sesión
            </Button>
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6 pt-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#2c6e49]" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="border-b border-gray-200 pb-6 last:border-0"
            >
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage
                    src={comment.profile.profilePicture || undefined}
                    alt={comment.profile.name}
                  />
                  <AvatarFallback className="bg-[#e8f0e9] text-[#2c6e49]">
                    {getInitials(comment.profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900 break-words">
                        {comment.profile.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    {canDeleteComment(comment) && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Eliminar comentario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 mt-1 break-words whitespace-pre-wrap leading-relaxed">
                    {comment.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Aún no hay comentarios en esta campaña.
            </p>
            <p className="text-gray-400 text-sm mt-1">
              ¡Sé el primero en dejar un mensaje de apoyo!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
