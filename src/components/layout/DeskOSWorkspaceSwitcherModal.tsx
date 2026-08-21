import React from 'react';
import { Home, Users, Check, X, Shield, Sparkles, RefreshCw } from 'lucide-react';
import { Member } from '../../types';
import { WORKSPACE_PREFIX } from '../../services/workspaceService';

interface DeskOSWorkspaceSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  currentUser: Member | null;
  activeWorkspaceId: string;
  onSelectWorkspace: (workspaceId: string) => void;
}

export const DeskOSWorkspaceSwitcherModal: React.FC<DeskOSWorkspaceSwitcherModalProps> = ({
  isOpen,
  onClose,
  members,
  currentUser,
  activeWorkspaceId,
  onSelectWorkspace,
}) => {
  if (!isOpen) return null;

  const currentUserId = currentUser?.id || currentUser?.username || 'u-1';
  const defaultWsId = `${WORKSPACE_PREFIX}${currentUserId}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-[#fffbf0] border-2 border-[#cbb89d] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 text-[#3d2b17]">
        {/* Header Bar */}
        <div className="bg-[#dfccb0] px-5 py-3.5 border-b border-[#cbb89d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-700 text-white rounded-xl shadow-xs">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[#3d2b17] uppercase tracking-wide">
                Bộ Chuyển Đổi Không Gian Làm Việc
              </h3>
              <p className="text-[10px] font-bold text-[#5c4327]">
                Đặc quyền Quản trị hệ thống (Admin)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/60 hover:bg-white text-[#5c4327] border border-[#cbb89d] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs font-bold text-[#5c4327] leading-relaxed">
            Mỗi giáo viên có một <span className="text-emerald-800 font-extrabold">Không gian làm việc độc lập 100%</span> (sơ đồ chỗ ngồi, điểm danh, chấm sao, thi đua và vườn tri thức). Thầy/Cô có thể chọn không gian để kiểm tra dữ liệu của từng giáo viên:
          </p>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
            {/* My Own Workspace */}
            <button
              onClick={() => {
                onSelectWorkspace(defaultWsId);
                onClose();
              }}
              className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                activeWorkspaceId === defaultWsId
                  ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                  : 'bg-white hover:bg-amber-50/50 border-[#cbb89d]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 border ${
                  activeWorkspaceId === defaultWsId
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs text-[#3d2b17]">
                      {currentUser?.name || 'Không gian của tôi (Admin)'}
                    </span>
                    <span className="text-[9px] bg-amber-200 text-amber-900 px-2 py-0.2 rounded-full font-black border border-amber-300">
                      Của tôi
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-[#806443] mt-0.5">
                    {currentUser?.role || 'Quản trị hệ thống (Admin)'}
                  </p>
                </div>
              </div>

              {activeWorkspaceId === defaultWsId && (
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </button>

            {/* Other Teachers' Workspaces */}
            <div className="pt-2">
              <span className="text-[10px] font-black uppercase text-[#806443] tracking-wider px-1">
                Không gian giáo viên bộ môn:
              </span>
            </div>

            {members
              .filter(m => m.id !== currentUser?.id && m.username !== currentUser?.username)
              .map(member => {
                const wsId = `${WORKSPACE_PREFIX}${member.id || member.username}`;
                const isSelected = activeWorkspaceId === wsId;

                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      onSelectWorkspace(wsId);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white hover:bg-amber-50/50 border-[#cbb89d]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 border ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                          : 'bg-[#f0e4d0] text-[#5c4327] border-[#d6c4a8]'
                      }`}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-[#3d2b17]">
                            Thầy/Cô {member.name}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-[#806443] mt-0.5">
                          {member.role || 'Giáo viên bộ môn'} • @{member.username}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
          </div>

          <div className="pt-2 border-t border-[#cbb89d] flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#dfccb0] hover:bg-[#d0bca0] text-[#3d2b17] rounded-xl font-black text-xs border border-[#cbb89d] transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
