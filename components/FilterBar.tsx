import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Staff } from '../types';

interface FilterBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedAssignee: string | null;
    onAssigneeChange: (assigneeId: string | null) => void;
    selectedPriority: string | null;
    onPriorityChange: (priority: string | null) => void;
    staffMembers: Staff[];
    onClearFilters: () => void;
    activeFilterCount: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
    searchQuery,
    onSearchChange,
    selectedAssignee,
    onAssigneeChange,
    selectedPriority,
    onPriorityChange,
    staffMembers,
    onClearFilters,
    activeFilterCount,
}) => {
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-3">
                <Filter size={16} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700">Filters</h3>
                {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                        {activeFilterCount}
                    </span>
                )}
                {activeFilterCount > 0 && (
                    <button
                        onClick={onClearFilters}
                        className="ml-auto text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
                    >
                        <X size={14} />
                        Clear all
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Search Input */}
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                {/* Assignee Filter */}
                <div className="relative">
                    <select
                        value={selectedAssignee || ''}
                        onChange={(e) => onAssigneeChange(e.target.value || null)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Assignees</option>
                        {staffMembers.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                                {staff.role} [{staff.name}]
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>

                {/* Priority Filter */}
                <div className="relative">
                    <select
                        value={selectedPriority || ''}
                        onChange={(e) => onPriorityChange(e.target.value || null)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Priorities</option>
                        <option value="HIGH">High Priority</option>
                        <option value="MEDIUM">Medium Priority</option>
                        <option value="LOW">Low Priority</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
