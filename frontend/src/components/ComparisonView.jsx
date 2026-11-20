
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Activity,
  Clock3,
  Wrench,
  Coins,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const axis = { fill: "#94a3b8", fontSize: 12 };
const grid = { stroke: "#1e293b" };

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  good,
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <Icon size={18} className="text-cyan-400" />
      </div>

      <p
        className={`mt-3 text-2xl font-bold ${
          good === true
            ? "text-emerald-400"
            : good === false
            ? "text-rose-400"
            : "text-slate-100"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function DeltaCard({
  label,
  value,
  suffix = "",
  prefix = "",
  higherIsBetter = true,
  percent = false,
}) {
  const number = Number(value || 0);
  const good = higherIsBetter ? number >= 0 : number <= 0;

  return (
    <div className="panel p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-semibold ${
          good ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {number > 0 ? "+" : ""}
        {prefix}
        {percent
          ? `${(number * 100).toFixed(1)}%`
          : number.toFixed(2)}
        {suffix}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {number === 0 ? "No change" : good ? "Improved" : "Needs attention"}
      </p>
    </div>
  );
}

export default function ComparisonView({
  baseline,
  candidate,
  delta,
}) {
  if (!baseline || !candidate) {
    return (
      <div className="panel p-8 text-center">
        <Activity className="mx-auto mb-3 text-cyan-400" size={28} />
        <h3 className="font-semibold text-slate-200">
          Select two completed runs
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Choose a baseline and candidate from the same test suite,
          then compare their performance.
        </p>
      </div>
    );
  }

  const baselineMetrics = delta?.baseline;
  const candidateMetrics = delta?.candidate;

  const bars = [
    {
      metric: "Pass rate (%)",
      Baseline: baseline.pass_rate * 100,
      Candidate: candidate.pass_rate * 100,
    },
    {
      metric: "Latency (ms)",
      Baseline: baseline.latency_ms,
      Candidate: candidate.latency_ms,
    },
    {
      metric: "Tool calls",
      Baseline: baseline.tool_call_count,
      Candidate: candidate.tool_call_count,
    },
  ];

  const retries = [
    {
      version: "Baseline",
      retries: baselineMetrics?.retry_count ?? 0,
    },
    {
      version: "Candidate",
      retries: candidateMetrics?.retry_count ?? 0,
    },
  ];

  const regressions = delta?.regression_count;
  const improvements = delta?.improvement_count;

  return (
    <div className="space-y-5">

      {/* Main comparison */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Performance comparison
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <MetricCard
            icon={Activity}
            label="Baseline pass rate"
            value={`${(baseline.pass_rate * 100).toFixed(1)}%`}
            description={`Run #${baseline.id}`}
          />

          <MetricCard
            icon={CheckCircle2}
            label="Candidate pass rate"
            value={`${(candidate.pass_rate * 100).toFixed(1)}%`}
            description={`Run #${candidate.id}`}
            good={
              candidate.pass_rate >= baseline.pass_rate
                ? true
                : false
            }
          />

          <MetricCard
            icon={Clock3}
            label="Candidate latency"
            value={`${Math.round(candidate.latency_ms)} ms`}
            description={`Baseline: ${Math.round(baseline.latency_ms)} ms`}
            good={
              candidate.latency_ms <= baseline.latency_ms
            }
          />

          <MetricCard
            icon={Wrench}
            label="Candidate tool calls"
            value={candidate.tool_call_count}
            description={`Baseline: ${baseline.tool_call_count}`}
            good={
              candidate.tool_call_count <= baseline.tool_call_count
            }
          />

        </div>
      </div>

      {/* Changes */}
      {delta && (
        <>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-200">
              Performance changes
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <DeltaCard
                label="Pass rate change"
                value={delta.pass_rate_delta}
                percent
              />

              <DeltaCard
                label="Latency change"
                value={delta.latency_delta_ms}
                suffix=" ms"
                higherIsBetter={false}
              />

              <DeltaCard
                label="Tool call change"
                value={delta.tool_call_delta}
                higherIsBetter={false}
              />

              <DeltaCard
                label="Cost change"
                value={delta.cost_delta_usd}
                prefix="$"
                higherIsBetter={false}
              />

            </div>
          </div>

          {/* Reliability */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-200">
              Reliability analysis
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <MetricCard
                icon={RefreshCw}
                label="Baseline retries"
                value={baselineMetrics?.retry_count ?? "—"}
                description="Estimated repeated attempts"
              />

              <MetricCard
                icon={RefreshCw}
                label="Candidate retries"
                value={candidateMetrics?.retry_count ?? "—"}
                description={
                  delta.retry_delta == null
                    ? "Not calculated"
                    : `${Math.abs(delta.retry_delta)} ${
                        delta.retry_delta > 0 ? "more" : "fewer"
                      } than baseline`
                }
                good={
                  delta.retry_delta == null
                    ? undefined
                    : delta.retry_delta <= 0
                }
              />

              <MetricCard
                icon={AlertTriangle}
                label="Regressions"
                value={regressions ?? "—"}
                description="Previously passing tests now failing"
                good={regressions === undefined ? undefined : regressions === 0}
              />

              <MetricCard
                icon={TrendingUp}
                label="Improvements"
                value={improvements ?? "—"}
                description="Previously failing tests now passing"
                good={improvements > 0}
              />

            </div>
          </div>

          {regressions > 0 && (
            <div className="panel border border-rose-500/30 p-4">
              <div className="flex items-center gap-2 text-rose-300">
                <AlertTriangle size={18} />
                <h3 className="font-semibold">
                  Regression detected
                </h3>
              </div>

              <p className="mt-2 text-sm text-slate-400">
                {regressions} test case(s) passed in the baseline
                but failed in the candidate.
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Test case IDs:{" "}
                {delta.regression_case_ids?.join(", ") || "Unavailable"}
              </p>
            </div>
          )}

          {regressions === 0 && (
            <div className="panel border border-emerald-500/30 p-4">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 size={18} />
                <h3 className="font-semibold">
                  No regressions detected
                </h3>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                No previously passing test cases failed in this candidate run.
              </p>
            </div>
          )}
        </>
      )}

      {!delta && (
        <div className="panel p-4 text-sm text-slate-400">
          Save the comparison to calculate retry counts and test regressions.
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">

        <div className="panel p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">
            Baseline vs candidate
          </h3>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars}>
                <CartesianGrid {...grid} />
                <XAxis dataKey="metric" tick={axis} />
                <YAxis tick={axis} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                  }}
                />
                <Legend />
                <Bar dataKey="Baseline" fill="#64748b" radius={4} />
                <Bar dataKey="Candidate" fill="#22d3ee" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Metrics use different units; compare individual values carefully.
          </p>
        </div>

        <div className="panel p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">
            Retry comparison
          </h3>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retries}>
                <CartesianGrid {...grid} />
                <XAxis dataKey="version" tick={axis} />
                <YAxis tick={axis} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                  }}
                />
                <Bar
                  dataKey="retries"
                  name="Retries"
                  fill="#a78bfa"
                  radius={5}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
