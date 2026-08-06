import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const state = (this as any).state as State | undefined;
    const props = (this as any).props as Props | undefined;

    if (state?.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-slate-100 p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-800">Đã xảy ra sự cố không mong muốn</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống gặp một lỗi nhỏ khi hiển thị. Bạn có thể nhấn nút bên dưới để tải lại ứng dụng.
              </p>
            </div>
            {state.error?.message && (
              <div className="bg-slate-100 p-3 rounded-xl text-left text-[11px] font-mono text-slate-600 overflow-x-auto max-h-24">
                {state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại trang ứng dụng
            </button>
          </div>
        </div>
      );
    }

    return props?.children || null;
  }
}
