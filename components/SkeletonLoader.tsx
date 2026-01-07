import React from 'react';

interface SkeletonLoaderProps {
    variant?: 'card' | 'list' | 'table';
    count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ variant = 'card', count = 3 }) => {
    // Shimmer animation styles
    const shimmerClass = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

    if (variant === 'card') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: count }).map((_, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 bg-slate-200 rounded-full ${shimmerClass}`}></div>
                            <div className="flex-1">
                                <div className={`h-4 bg-slate-200 rounded w-3/4 mb-2 ${shimmerClass}`}></div>
                                <div className={`h-3 bg-slate-200 rounded w-1/2 ${shimmerClass}`}></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className={`h-3 bg-slate-200 rounded w-full ${shimmerClass}`}></div>
                            <div className={`h-3 bg-slate-200 rounded w-5/6 ${shimmerClass}`}></div>
                            <div className={`h-3 bg-slate-200 rounded w-4/6 ${shimmerClass}`}></div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <div className={`h-6 bg-slate-200 rounded w-20 ${shimmerClass}`}></div>
                            <div className={`h-6 bg-slate-200 rounded w-16 ${shimmerClass}`}></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'list') {
        return (
            <div className="space-y-4">
                {Array.from({ length: count }).map((_, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 bg-slate-200 rounded-full flex-shrink-0 ${shimmerClass}`}></div>
                            <div className="flex-1 space-y-2">
                                <div className={`h-4 bg-slate-200 rounded w-3/4 ${shimmerClass}`}></div>
                                <div className={`h-3 bg-slate-200 rounded w-1/2 ${shimmerClass}`}></div>
                            </div>
                            <div className={`w-20 h-8 bg-slate-200 rounded ${shimmerClass}`}></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'table') {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <div className={`h-6 bg-slate-200 rounded w-48 ${shimmerClass}`}></div>
                </div>
                <div className="divide-y divide-slate-200">
                    {Array.from({ length: count }).map((_, index) => (
                        <div key={index} className="p-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 bg-slate-200 rounded-full ${shimmerClass}`}></div>
                                <div className="flex-1 space-y-2">
                                    <div className={`h-4 bg-slate-200 rounded w-2/3 ${shimmerClass}`}></div>
                                    <div className={`h-3 bg-slate-200 rounded w-1/3 ${shimmerClass}`}></div>
                                </div>
                                <div className={`w-24 h-6 bg-slate-200 rounded ${shimmerClass}`}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
};

export default SkeletonLoader;
