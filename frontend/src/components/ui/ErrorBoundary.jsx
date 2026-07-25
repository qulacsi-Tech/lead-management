import { Component } from 'react';
import Button from './Button';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-error mb-3">warning</span>
            <h2 className="font-display text-xl font-bold text-primary m-0 mb-2">Something went wrong</h2>
            <p className="text-sm text-on-surface-variant m-0 mb-6">
              The page hit an unexpected error. You can try again, or head back and retry your last action.
            </p>
            <Button onClick={this.handleReset} className="w-full">Try again</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
