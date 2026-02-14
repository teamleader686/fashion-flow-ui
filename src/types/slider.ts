export interface Slider {
    id: string;
    image_url: string;
    title?: string;
    subtitle?: string;
    redirect_url?: string;
    display_order: number;
    status: 'active' | 'inactive';
    created_at: string;
}

export interface SliderInput {
    image_url: string;
    title?: string;
    subtitle?: string;
    redirect_url?: string;
    display_order: number;
    status: 'active' | 'inactive';
}
