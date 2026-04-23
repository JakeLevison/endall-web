"use client";

import { Component, type ReactNode } from "react";

type Props = {
  stepLabel: string;
  onReset: () => void;
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class StepErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Surface in the browser console so QA can spot regressions quickly.
    if (typeof console !== "undefined") {
      console.error(`[onboarding] step crash (${this.props.stepLabel}):`, error);
    }
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="border border-red-500/30 bg-red-500/5 rounded-lg p-4">
          <p className="text-[13px] font-semibold text-red-300 mb-1">
            Something went wrong on this step
          </p>
          <p className="text-[12px] text-red-200/80 mb-3">
            {this.state.error.message || "Unknown error"} — your previous
            inputs are still saved. Reload the step to continue.
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="text-[12px] border border-red-500/40 text-red-200 rounded px-3 py-1.5 hover:bg-red-500/10"
          >
            Reload step
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
