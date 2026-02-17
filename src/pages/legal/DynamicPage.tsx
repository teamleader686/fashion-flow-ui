import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface PageData {
    title: string;
    content: string;
    updated_at: string;
}

export default function DynamicPage() {
    const { slug } = useParams<{ slug: string }>();
    const [page, setPage] = useState<PageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPage = async () => {
            try {
                setLoading(true);
                setError(false);
                const { data, error } = await supabase
                    .from("pages")
                    .select("title, content, updated_at")
                    .eq("slug", slug)
                    .eq("is_active", true)
                    .single();

                if (error) throw error;
                setPage(data);
            } catch (err) {
                console.error("Error fetching page:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchPage();
    }, [slug]);

    if (loading) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <Skeleton className="h-10 w-3/4 mb-6" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-2" />
                    <Skeleton className="h-4 w-full mb-8" />
                </div>
            </Layout>
        );
    }

    if (error || !page) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-12 text-center">
                    <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
                    <p className="text-muted-foreground mb-6">The page you are looking for does not exist.</p>
                    <Link to="/">
                        <Button>Return Home</Button>
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{page.title}</h1>
                <p className="text-sm text-muted-foreground mb-8">
                    Last updated: {new Date(page.updated_at).toLocaleDateString()}
                </p>

                <div
                    className="prose prose-sm md:prose-base max-w-none text-foreground dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                />
            </div>
        </Layout>
    );
}
