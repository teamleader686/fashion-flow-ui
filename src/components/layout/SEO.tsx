import { useEffect } from "react";

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
}

const SEO = ({
    title = "StyleBazaar - Premium Women's Kurtis & Dresses",
    description = "Shop the latest collection of premium women's kurtis, dresses, and ethnic wear at StyleBazaar.",
    image = "https://lovable.dev/opengraph-image-p98pqg.png",
    url = window.location.href,
    type = "website"
}: SEOProps) => {
    useEffect(() => {
        // Update title
        document.title = `${title} | StyleBazaar`;

        // Update meta tags
        const updateMeta = (name: string, content: string, property = false) => {
            let element = property
                ? document.querySelector(`meta[property="${name}"]`)
                : document.querySelector(`meta[name="${name}"]`);

            if (!element) {
                element = document.createElement('meta');
                if (property) {
                    element.setAttribute('property', name);
                } else {
                    element.setAttribute('name', name);
                }
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        updateMeta("description", description);
        updateMeta("og:title", title, true);
        updateMeta("og:description", description, true);
        updateMeta("og:image", image, true);
        updateMeta("og:url", url, true);
        updateMeta("og:type", type, true);
        updateMeta("twitter:card", "summary_large_image");
        updateMeta("twitter:title", title);
        updateMeta("twitter:description", description);
        updateMeta("twitter:image", image);
    }, [title, description, image, url, type]);

    return null;
};

export default SEO;
