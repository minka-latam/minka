"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  ChevronDown,
  Send,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCampaign, CampaignComment } from "@/hooks/use-campaign";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

interface CommentsTabProps {
  campaign: {
    id?: string;
  } & Record<string, unknown>;
}

export function CommentsTab({ campaign }: CommentsTabProps) {
  const campaignId = campaign.id ?? "";
  const [comments, setComments] = useState<CampaignComment[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(20);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newComment, setNewComment] = useState("");

  const {
    isLoadingComments,
    getCampaignComments,
    deleteCampaignComment,
    postCampaignComment,
    isPostingComment,
  } = useCampaign();

  useEffect(() => {
    fetchComments();
  }, [campaignId, sortBy]);

  const fetchComments = async (reset: boolean = true) => {
    const currentOffset = reset ? 0 : offset;

    const commentsData = await getCampaignComments(
      campaignId,
      limit,
      currentOffset,
      sortBy
    );

    if (commentsData) {
      if (reset) {
        setComments(commentsData.comments);
      } else {
        setComments([...comments, ...commentsData.comments]);
      }

      setTotalComments(commentsData.total);
      setHasMoreComments(commentsData.hasMore);

      if (!reset) {
        setOffset(currentOffset + limit);
      } else {
        setOffset(limit);
      }
    }
  };

  const loadMoreComments = () => {
    fetchComments(false);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    const success = await deleteCampaignComment(campaignId, commentToDelete);

    if (success) {
      // Remove the comment from the list
      setComments(comments.filter((comment) => comment.id !== commentToDelete));
      setTotalComments(totalComments - 1);
      toast({
        title: "Comentario eliminado",
        description: "El comentario ha sido eliminado correctamente.",
      });
    }

    setIsDeleteDialogOpen(false);
    setCommentToDelete(null);
  };

  const openDeleteDialog = (commentId: string) => {
    setCommentToDelete(commentId);
    setIsDeleteDialogOpen(true);
  };

  const handleAddComment = async () => {
    const content = newComment.trim();
    if (!content) return;

    const createdComment = await postCampaignComment(campaignId, content);

    if (createdComment) {
      setComments([createdComment, ...comments]);
      setTotalComments(totalComments + 1);
      setNewComment("");
      setIsAddingComment(false);
      toast({
        title: "Comentario publicado",
        description: "Tu comentario fue agregado correctamente.",
      });
    }
  };

  // Helper function to calculate days since a date
  const getDaysSince = (dateString: string): string => {
    const commentDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - commentDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return `${diffDays} ${diffDays === 1 ? "día" : "días"}`;
  };

  const sortLabel =
    sortBy === "recent" ? "Más recientes" : "Más antiguos";

  return (
    <div className="w-full px-6 md:px-8 lg:px-16 xl:px-24 py-6 flex flex-col min-h-[calc(100vh-200px)]">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
        Comentarios
      </h2>
      <p className="text-xl text-gray-600 leading-relaxed mb-10">
        Lee los mensajes que recibe tu campaña y agrega comentarios cuando
        quieras compartir una aclaración o actualización breve.
      </p>

      <div className="border-b border-[#478C5C]/20 my-8"></div>

      {/* Comments section */}
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <h3 className="text-2xl font-semibold">Todos los comentarios</h3>
            <p className="text-gray-600">{totalComments} Resultados</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              type="button"
              className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
              onClick={() => setIsAddingComment(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Agregar comentario
            </Button>

            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-300 bg-white">
                  <span className="mr-2">Ordenar por: {sortLabel}</span>
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("recent")}>
                  Más recientes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  Más antiguos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isAddingComment && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4">
            <Textarea
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              placeholder="Escribe un comentario para tu campaña..."
              className="min-h-[120px] resize-none border-gray-300 text-base focus:border-[#2c6e49] focus:ring-[#2c6e49]"
              disabled={isPostingComment}
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-gray-300 bg-white"
                onClick={() => {
                  setIsAddingComment(false);
                  setNewComment("");
                }}
                disabled={isPostingComment}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
                onClick={handleAddComment}
                disabled={!newComment.trim() || isPostingComment}
              >
                {isPostingComment ? (
                  <LoadingSpinner size="sm" tone="inverse" className="mr-2" />
                ) : (
                  <Send size={14} className="mr-2" />
                )}
                Publicar comentario
              </Button>
            </div>
          </div>
        )}

        {isLoadingComments && comments.length === 0 ? (
          <div className="flex items-center justify-center py-8 flex-1">
            <LoadingSpinner size="md" />
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-8 flex-1">
            {/* Comment items */}
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="border-b border-gray-200 pb-6 mb-6 last:border-b-0"
              >
                <div className="flex gap-4 mb-3">
                  <div className="w-12 h-12 bg-green-600 rounded-full overflow-hidden flex items-center justify-center text-white font-medium">
                    {comment.profile?.name?.substring(0, 2).toUpperCase() || ""}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {comment.profile?.name || "Usuario"}
                        </h4>
                        <p className="text-gray-500 text-sm">
                          {getDaysSince(comment.createdAt)}
                        </p>
                        {comment.donation_amount && (
                          <div className="mt-1 text-sm text-[#2c6e49] font-medium">
                            Donó Bs. {comment.donation_amount.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => openDeleteDialog(comment.id)}
                        className="text-[#1a5535] hover:text-[#0e3e20] flex items-center"
                      >
                        <span className="mr-2">Eliminar comentario</span>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="mt-2 text-gray-700">
                      {comment.content || comment.message || ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {hasMoreComments && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  className="border-gray-300"
                  onClick={loadMoreComments}
                  disabled={isLoadingComments}
                >
                  {isLoadingComments ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : null}
                  Cargar más comentarios
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg flex-1 flex flex-col justify-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay comentarios aún
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Tu campaña no tiene comentarios por el momento.
            </p>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comentario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El comentario será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
