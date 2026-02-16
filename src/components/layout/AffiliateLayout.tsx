import React from 'react';

const AffiliateLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            {/* Clean Header - No Main Navbar */}
            <div className="bg-white shadow sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-lg font-bold text-primary">FashionFlow Affiliate</h1>
                    {/* Add user menu or logout here if needed, but Dashboard has it inside content usually */}
                </div>
            </div>

            {/* Content */}
            <main className="p-4 md:p-8 max-w-7xl mx-auto">
                {children}
            </main>
        </div>
    );
};

export default AffiliateLayout;
