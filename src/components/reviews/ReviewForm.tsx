import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface ReviewFormProps {
    productId: string;
    userId: string;
    onReviewSubmitted: () => void;
}

export default function ReviewForm({ productId, userId, onReviewSubmitted }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        setLoading(true);
        try {
            // Check for duplicate
            const { data: existing } = await supabase
                .from("product_reviews")
                .select("id")
                .eq("user_id", userId)
                .eq("product_id", productId)
                .maybeSingle();

            if (existing) {
                toast.error("You have already reviewed this product");
                setLoading(false);
                return;
            }

            const { error } = await supabase.from("product_reviews").insert({
                user_id: userId,
                product_id: productId,
                rating,
                comment,
                is_approved: false, // Default pending
            });

            if (error) throw error;

            toast.success("Review submitted successfully!");
            setRating(0);
            setComment("");
            onReviewSubmitted();

        } catch (error: any) {
            console.error(error);
            toast.error("Failed to submit review");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-muted/30 p-6 rounded-xl border border-border">
            <h3 className="font-semibold mb-4">Write a Review</h3>

            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Rating</label>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="focus:outline-none transition-transform hover:scale-110"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    className={`h-6 w-6 ${star <= (hoverRating || rating)
                                        ? "fill-yellow-500 text-yellow-500"
                                        : "text-muted-foreground"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Your Review</label>
                    <Textarea
                        placeholder="Share your experience with this product..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        className="bg-background resize-none"
                    />
                </div>

                <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto">
                    {loading ? "Submitting..." : "Submit Review"}
                </Button>
            </div>
        </div>
    );
}
