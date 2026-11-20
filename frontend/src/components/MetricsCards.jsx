import {
  Activity,
  Clock3,
  Coins,
  Fish,
  Percent,
  Wrench,
  CheckCircle2,
  XCircle,
  FlaskConical,
} from "lucide-react";

function Card({ icon: Icon, label, value, hint, accent }) {
  return (
    <div className="panel p-5 transition-all duration-200 hover:-translate-y-1 hover:border-slate-600">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <Icon size={19} className={accent} />
      </div>

      <p className="text-3xl font-bold tracking-tight text-slate-100">
        {value}
      </p>

      {hint && (
        <p className="mt-2 text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function MetricsCards({ overview }) {
  if (!overview) return null;

  const total = overview.latest_test_total || 0;
  const passed = overview.latest_test_passed || 0;
  const failed = overview.latest_test_failed || 0;

  const passRate = total > 0
    ? Math.round((passed / total) * 100)
    : 0;

  return (
    <div className="space-y-4">

      {/* Main test results */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Test Results Overview
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <Card
            icon={FlaskConical}
            label="Total Tests"
            value={total}
            hint="Latest completed test run"
            accent="text-cyan-400"
          />

          <Card
            icon={CheckCircle2}
            label="Passed Tests"
            value={passed}
            hint="Tests meeting all assertions"
            accent="text-emerald-400"
          />

          <Card
            icon={XCircle}
            label="Failed Tests"
            value={failed}
            hint="Tests with failed assertions"
            accent="text-rose-400"
          />

          <Card
            icon={Percent}
            label="Overall Pass Rate"
            value={`${passRate}%`}
            hint="Passed tests / total tests"
            accent="text-indigo-400"
          />

        </div>
      </div>

      {/* Supporting performance metrics */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Agent Performance
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <Card
            icon={Activity}
            label="Total Runs"
            value={overview.total_runs}
            hint={`${overview.completed_runs} completed executions`}
            accent="text-cyan-400"
          />

          <Card
            icon={Clock3}
            label="Median Latency"
            value={`${Math.round(overview.median_latency_ms)} ms`}
            hint="Execution response time"
            accent="text-amber-400"
          />

          <Card
            icon={Wrench}
            label="Tool Calls / Task"
            value={overview.tool_calls_per_task}
            hint="Average tool usage"
            accent="text-indigo-400"
          />

          <Card
            icon={Coins}
            label="Estimated Cost"
            value={`$${Number(overview.estimated_cost_usd || 0).toFixed(3)}`}
            hint="Estimated total execution cost"
            accent="text-rose-400"
          />

        </div>
      </div>

      <div className="text-xs text-slate-500">
        TinyFish events recorded: {overview.tinyfish_events ?? 0}
      </div>

    </div>
  );
}
