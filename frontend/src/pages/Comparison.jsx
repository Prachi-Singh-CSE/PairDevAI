
import { useEffect, useMemo, useState } from "react";
import ComparisonView from "../components/ComparisonView";
import { api } from "../api";
import { GitCompareArrows, RefreshCw } from "lucide-react";

export default function Comparison({ runs = [] }) {
  const completed = runs.filter(
    (run) => run.status === "completed"
  );

  const [baselineId, setBaselineId] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [delta, setDelta] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const baseline = completed.find(
    (run) => run.id === Number(baselineId)
  );

  const candidateOptions = useMemo(() => {
    if (!baseline) return [];
    return completed.filter(
      (run) =>
        run.suite_id === baseline.suite_id &&
        run.id !== baseline.id
    );
  }, [completed, baseline]);

  const candidate = completed.find(
    (run) => run.id === Number(candidateId)
  );

  // Select initial runs from the same suite.
  useEffect(() => {
    if (!completed.length) {
      setBaselineId("");
      setCandidateId("");
      return;
    }

    const firstBaseline =
      completed.find((run) => run.version_name === "Baseline") ||
      completed[0];

    const firstCandidate =
      completed.find(
        (run) =>
          run.suite_id === firstBaseline.suite_id &&
          run.id !== firstBaseline.id
      );

    setBaselineId(String(firstBaseline.id));
    setCandidateId(
      firstCandidate ? String(firstCandidate.id) : ""
    );
  }, [runs.length]);

  // Reset comparison when selected runs change.
  useEffect(() => {
    setDelta(null);
    setError("");

    if (
      baseline &&
      candidate &&
      baseline.suite_id !== candidate.suite_id
    ) {
      setCandidateId("");
    }
  }, [baselineId, candidateId]);

  async function compareRuns() {
    if (!baseline || !candidate) {
      setError("Please select two completed runs from the same suite.");
      return;
    }

    setLoading(true);
    setError("");
    setDelta(null);

    try {
      const result = await api.createComparison({
        baseline_run_id: Number(baselineId),
        candidate_run_id: Number(candidateId),
      });

      setDelta(result.delta_metrics);
    } catch (err) {
      setError(err.message || "Unable to compare runs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">

      {/* Page heading */}
      <div>
        <div className="flex items-center gap-2">
          <GitCompareArrows className="text-cyan-400" size={23} />
          <h1 className="text-2xl font-semibold text-slate-100">
            Agent Performance Comparison
          </h1>
        </div>

        <p className="mt-2 text-sm text-slate-400">
          Compare baseline and candidate versions to identify
          performance changes, retries and reliability regressions.
        </p>
      </div>

      {/* Run selection */}
      <div className="panel space-y-4 p-4">

        <h2 className="text-sm font-semibold text-slate-200">
          Select test executions
        </h2>

        <div className="grid gap-4 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-xs text-slate-400">
              Baseline version
            </label>

            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-200"
              value={baselineId}
              onChange={(e) => {
                setBaselineId(e.target.value);
                setCandidateId("");
                setDelta(null);
              }}
            >
              <option value="">Select baseline run</option>

              {completed.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.version_name} · {run.suite_name} · Run #{run.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs text-slate-400">
              Candidate version
            </label>

            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-200 disabled:opacity-40"
              value={candidateId}
              onChange={(e) => {
                setCandidateId(e.target.value);
                setDelta(null);
              }}
              disabled={!baseline}
            >
              <option value="">Select candidate run</option>

              {candidateOptions.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.version_name} · {run.suite_name} · Run #{run.id}
                </option>
              ))}
            </select>
          </div>

        </div>

        {baseline && (
          <p className="text-xs text-slate-500">
            Comparing test suite: {baseline.suite_name}
          </p>
        )}

        <button
          type="button"
          onClick={compareRuns}
          disabled={!baseline || !candidate || loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Comparing...
            </>
          ) : (
            <>
              <GitCompareArrows size={16} />
              Compare agent versions
            </>
          )}
        </button>

        {error && (
          <p className="text-sm text-rose-400">
            {error}
          </p>
        )}

      </div>

      {/* Comparison results */}
      <ComparisonView
        baseline={baseline}
        candidate={candidate}
        delta={delta}
      />

    </div>
  );
}
