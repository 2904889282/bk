import React from 'react';
import { Button, Result } from 'antd';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

/** 全局错误边界：防止单个页面崩溃导致整个应用白屏 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="页面渲染异常"
          subTitle={this.state.error?.message || '未知错误，请刷新页面重试'}
          extra={[
            <Button type="primary" key="retry" onClick={this.handleRetry}>重试</Button>,
            <Button key="refresh" onClick={() => window.location.reload()}>刷新页面</Button>,
          ]}
        />
      );
    }
    return this.props.children;
  }
}
