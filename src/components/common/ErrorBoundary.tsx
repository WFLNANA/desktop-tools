
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          height: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '24px'
        }}>
          <Result
            status="error"
            title="出错了"
            subTitle="加载系统信息时发生错误，请重试。"
            extra={[
              <Button type="primary" key="reload" onClick={() => window.location.reload()}>
                刷新页面
              </Button>
            ]}
          >
            {process.env.NODE_ENV === 'development' && (
              <div style={{ marginTop: 16, textAlign: 'left', maxHeight: 200, overflow: 'auto', background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                 <pre>{this.state.error?.toString()}</pre>
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}
