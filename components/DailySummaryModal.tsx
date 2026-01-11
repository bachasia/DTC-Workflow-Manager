
import React from 'react';
import { Task, Staff, Role, TaskStatus } from '../types';
import { X, FileText, CheckCircle, Clock, AlertCircle, FileCode, FileSpreadsheet } from 'lucide-react';

interface DailySummaryModalProps {
  tasks: Task[];
  staffMembers: Staff[];
  onClose: () => void;
}

const DailySummaryModal: React.FC<DailySummaryModalProps> = ({ tasks, staffMembers, onClose }) => {
  const today = new Date().toISOString().split('T')[0];
  const todaysTasks = tasks.filter(t => t.createdAt.startsWith(today) || t.history.some(h => h.timestamp.startsWith(today)));

  const handleExportCSV = () => {
    // Prepare CSV data
    const csvRows = [];

    // Add header
    csvRows.push(['Staff Name', 'Role', 'Task Title', 'Status', 'Progress (%)', 'Blocker Reason', 'Related To']);

    // Add data rows
    staffMembers.filter(s => s.role !== Role.MANAGER).forEach(staff => {
      const staffTasksToday = todaysTasks.filter(t => t.assignedTo === staff.id);

      staffTasksToday.forEach(task => {
        csvRows.push([
          staff.name,
          staff.role,
          task.title,
          task.status,
          task.progress.toString(),
          task.blockerReason || '',
          task.blockerRelatedTo || ''
        ]);
      });
    });

    // Convert to CSV string
    const csvContent = csvRows.map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    // Add BOM for UTF-8 to ensure proper encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DTC_Team_Report_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportHTML = () => {
    const getStatusBadge = (status: TaskStatus) => {
      const badges = {
        [TaskStatus.DONE]: '<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; background: #dcfce7; color: #166534; border-radius: 12px; font-size: 11px; font-weight: 700;">✓ DONE</span>',
        [TaskStatus.BLOCKER]: '<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; background: #fed7aa; color: #9a3412; border-radius: 12px; font-size: 11px; font-weight: 700;">⚠ BLOCKER</span>',
        [TaskStatus.OVERDUE]: '<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; background: #fecaca; color: #991b1b; border-radius: 12px; font-size: 11px; font-weight: 700;">⏰ OVERDUE</span>',
        [TaskStatus.TODO]: '<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 11px; font-weight: 700;">○ TODO</span>',
        [TaskStatus.IN_PROGRESS]: '<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; background: #e0e7ff; color: #3730a3; border-radius: 12px; font-size: 11px; font-weight: 700;">⟳ IN PROGRESS</span>',
      };
      return badges[status] || status;
    };

    const getRoleBadge = (role: Role) => {
      const badges = {
        [Role.DESIGNER]: '<span style="padding: 3px 10px; background: #dbeafe; color: #1e40af; border-radius: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase;">DESIGNER</span>',
        [Role.SELLER]: '<span style="padding: 3px 10px; background: #dcfce7; color: #166534; border-radius: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase;">SELLER</span>',
        [Role.CS]: '<span style="padding: 3px 10px; background: #fed7aa; color: #9a3412; border-radius: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase;">CS</span>',
        [Role.MANAGER]: '<span style="padding: 3px 10px; background: #e9d5ff; color: #6b21a8; border-radius: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase;">MANAGER</span>',
      };
      return badges[role] || role;
    };

    let staffSections = '';
    staffMembers.filter(s => s.role !== Role.MANAGER).forEach(staff => {
      const staffTasksToday = todaysTasks.filter(t => t.assignedTo === staff.id);
      if (staffTasksToday.length === 0) return;

      let tasksHTML = '';
      staffTasksToday.forEach(task => {
        const blockerSection = task.status === TaskStatus.BLOCKER && task.blockerReason ? `
          <div style="margin-top: 12px; padding: 12px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px;">
            <p style="font-size: 10px; font-weight: 700; color: #9a3412; text-transform: uppercase; margin: 0 0 6px 0;">Blocker Reason:</p>
            <p style="font-size: 13px; color: #1e293b; font-style: italic; margin: 0;">"${task.blockerReason}"</p>
            ${task.blockerRelatedTo ? `<p style="font-size: 11px; color: #ea580c; margin: 6px 0 0 0; font-weight: 600;">Related: ${task.blockerRelatedTo}</p>` : ''}
          </div>
        ` : '';

        tasksHTML += `
          <div style="padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
              <div style="flex: 1; min-width: 0;">
                <p style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0; word-wrap: break-word;">${task.title}</p>
                <div style="margin-top: 6px;">
                  ${getStatusBadge(task.status)}
                </div>
              </div>
              <div style="text-align: right; flex-shrink: 0;">
                <p style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">${task.progress}%</p>
                <div style="width: 80px; height: 6px; background: #cbd5e1; border-radius: 10px; overflow: hidden;">
                  <div style="height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb); border-radius: 10px; width: ${task.progress}%;" />
                </div>
              </div>
            </div>
            ${blockerSection}
          </div>
        `;
      });

      staffSections += `
        <div style="margin-bottom: 32px; page-break-inside: avoid;">
          <div style="display: flex; align-items: center; gap: 12px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; margin-bottom: 16px;">
            <img src="${staff.avatar}" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #e2e8f0;" />
            <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0;">${staff.role} [${staff.name}]</h3>
            ${getRoleBadge(staff.role)}
          </div>
          ${tasksHTML}
        </div>
      `;
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DTC Team Report - ${today}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .header p {
      font-size: 14px;
      opacity: 0.9;
      font-weight: 500;
    }
    .content {
      padding: 40px;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Daily Activity Summary</h1>
      <p>Performance Report for ${today}</p>
    </div>
    <div class="content">
      ${staffSections}
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DTC_Team_Report_${today}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText size={24} className="text-blue-600" />
              Daily Activity Summary
            </h2>
            <p className="text-sm text-slate-500">Reviewing performance for {today}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-md"
            >
              <FileSpreadsheet size={18} />
              Export to CSV
            </button>
            <button
              onClick={handleExportHTML}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md"
            >
              <FileCode size={18} />
              Export to HTML
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-8">
            {staffMembers.filter(s => s.role !== Role.MANAGER).map(staff => {
              const staffTasksToday = todaysTasks.filter(t => t.assignedTo === staff.id);
              if (staffTasksToday.length === 0) return null;

              return (
                <div key={staff.id} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    <img src={staff.avatar} className="w-8 h-8 rounded-full" />
                    <h3 className="font-bold text-slate-800">{staff.role} [{staff.name}]</h3>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase">{staff.role}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staffTasksToday.map(task => (
                      <div key={task.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {task.status === TaskStatus.DONE ? (
                                <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                                  <CheckCircle size={10} /> Complete
                                </span>
                              ) : task.status === TaskStatus.OVERDUE ? (
                                <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                                  <AlertCircle size={10} /> Overdue
                                </span>
                              ) : task.status === TaskStatus.BLOCKER ? (
                                <span className="text-[10px] text-orange-600 font-bold flex items-center gap-1">
                                  <AlertCircle size={10} /> Blocked
                                </span>
                              ) : (
                                <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                                  <Clock size={10} /> {task.status.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-slate-900">{task.progress}%</p>
                            <div className="w-16 bg-slate-200 h-1 rounded-full mt-1 ml-auto">
                              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${task.progress}%` }} />
                            </div>
                          </div>
                        </div>

                        {task.status === TaskStatus.BLOCKER && task.blockerReason && (
                          <div className="bg-orange-50 border border-orange-100 p-2.5 rounded-xl">
                            <p className="text-[10px] font-bold text-orange-700 uppercase mb-1">Blocker Reason:</p>
                            <p className="text-xs text-slate-700 italic">"{task.blockerReason}"</p>
                            {task.blockerRelatedTo && (
                              <p className="text-[10px] text-orange-600 mt-1 font-semibold">Related: {task.blockerRelatedTo}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySummaryModal;
