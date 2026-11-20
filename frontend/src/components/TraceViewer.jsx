
import { useEffect, useMemo, useState } from "react";
import {
  Fish,
  Cpu,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock3,
  MessageSquare,
  ChevronDown,
} from "lucide-react";

function iconFor(type) {
  if (String(type).startsWith("tinyfish")) return Fish;
  if (String(type).startsWith("tool")) return Wrench;
  if (String(type).includes("llm")) return Cpu;
  if (String(type) === "agent.final") return MessageSquare;
  return AlertTriangle;
}

function readableEvent(type) {
  const labels = {
    "llm.call": "AI analysed the request",
    "llm.retry": "AI retried the operation",
    "llm.final": "Final response generated",
    "agent.final": "Agent response recorded",
    "tinyfish.search": "Searched web sources",
    "tinyfish.fetch": "Retrieved reference information",
    "tinyfish.STARTED": "Web agent started",
    "tinyfish.PROGRESS": "Web agent progressing",
    "tinyfish.COMPLETE": "Web agent completed",
    "tinyfish.ERROR": "Web agent encountered an error",
    "tool.lookup_order": "Checked order details",
    "tool.search_policy": "Checked refund policy",
    "tool.issue_refund": "Processed refund",
  };

  return labels[type] || String(type).replace(/[._]/g, " ");
}

function tone(status) {
  if (status === "error")
    return "border-rose-500/40 bg-rose-500/10 text-rose-300";

  if (status === "warn")
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";

  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
}

function getExpectedResponse(testCase) {
  if (!testCase) return "Expected response is not available.";

  const expected = testCase.expected_behaviour || {};

  if (expected.candidate_answer) return expected.candidate_answer;
  if (expected.expected_answer) return expected.expected_answer;
  if (expected.expected_response) return expected.expected_response;

  if (expected.agent_goal) {
    return `The agent should: ${expected.agent_goal}`;
  }

  if (expected.expect_refund === true) {
    return `Verify the order and issue a refund only if it is within the 30-day policy window.`;
  }

  if (expected.expect_refund === false) {
    return `Verify the order and deny the refund if it is outside the 30-day policy window.`;
  }

  return "Follow the expected behaviour configured for this test case.";
}

function getActualResponse(traces, testCaseId) {
  const finalEvent = traces.find(
    (event) =>
      event.test_case_id === testCaseId &&
      (event.event_type === "agent.final" ||
        event.event_type === "llm.final")
  );

  if (!finalEvent) return null;

  const output =
    finalEvent.payload?.output ??
    finalEvent.payload?.result ??
    finalEvent.payload;

  if (typeof output === "string") return output;

  if (output?.answer) return output.answer;
  if (output?.response) return output.response;
  if (output?.message) return output.message;

  if (output && typeof output === "object") {
    return Object.entries(output)
      .filter(([key, value]) => value !== null && key !== "tinyfish_run_id")
      .map(([key, value]) => {
        const label = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase());

        return `${label}: ${
          typeof value === "object"
            ? JSON.stringify(value)
            : String(value)
        }`;
      })
      .join("\n");
  }

  return null;
}

function ResponseCard({ title, content, success, icon: Icon }) {
  return (
    <div className="panel min-w-0 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon
          size={18}
          className={success ? "text-emerald-400" : "text-rose-400"}
        />
        <h3 className="text-sm font-semibold text-slate-200">
          {title}
        </h3>
      </div>

      <div className="min-h-28 whitespace-pre-wrap break-words rounded-lg bg-slate-950/70 p-3 text-sm leading-6 text-slate-300">
        {content || "No response recorded yet."}
      </div>
    </div>
  );
}

export default function TraceViewer({
  traces = [],
  evaluations = [],
  testCases = [],
}) {
  const [selected, setSelected] = useState(traces[0] || null);

  useEffect(() => {
    setSelected((current) => {
      if (current && traces.some((event) => event.id === current.id)) {
        return traces.find((event) => event.id === current.id);
      }
      return traces[0] || null;
    });
  }, [traces]);

  const selectedCaseId = selected?.test_case_id;

  const selectedCase = useMemo(
    () => testCases.find((item) => item.id === selectedCaseId),
    [testCases, selectedCaseId]
  );

  const caseEvaluations = useMemo(
    () =>
      evaluations.filter(
        (item) => item.test_case_id === selectedCaseId
      ),
    [evaluations, selectedCaseId]
  );

  const failedEvaluations = caseEvaluations.filter(
    (item) => !item.passed
  );

  const actualResponse = selectedCase
    ? getActualResponse(traces, selectedCase.id)
    : null;

  if (!traces.length) {
    return (
      <div className="panel p-8 text-sm text-slate-500">
        No trace events yet. Run a test suite to generate execution details.
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Expected vs Actual */}
      <div className="panel p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-100">
            Expected vs Actual Response
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Compare what the AI agent should have done with its actual output.
          </p>
        </div>

        {selectedCase ? (
          <>
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Test case
              </p>
              <p className="mt-1 text-sm font-medium text-cyan-300">
                {selectedCase.name}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {selectedCase.input_text}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">

              <ResponseCard
                title="Expected Response"
                content={getExpectedResponse(selectedCase)}
                success={true}
                icon={CheckCircle2}
              />

              <ResponseCard
                title="Actual Agent Response"
                content={actualResponse}
                success={!failedEvaluations.length}
                icon={MessageSquare}
              />

            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {failedEvaluations.length === 0 &&
              caseEvaluations.length > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
                  <CheckCircle2 size={14} />
                  All assertions passed
                </span>
              ) : failedEvaluations.length > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300">
                  <XCircle size={14} />
                  {failedEvaluations.length} assertion(s) failed
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  Waiting for evaluation results.
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Select a trace event associated with a test case to view its response comparison.
          </p>
        )}
      </div>

      {/* Execution timeline and details */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">

        <div className="panel overflow-hidden">
          <div className="border-b border-slate-800 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Execution Timeline
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Chronological sequence of agent activities.
            </p>
          </div>

          <ol className="max-h-[620px] space-y-2 overflow-auto p-4">
            {traces.map((event) => {
              const Icon = iconFor(event.event_type);
              const active = selected?.id === event.id;

              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(event)}
                    className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition ${
                      active
                        ? "border-cyan-500/50 bg-slate-800"
                        : "border-slate-800 bg-slate-900/40 hover:bg-slate-800/70"
                    }`}
                  >
                    <span
                      className={`mt-0.5 rounded-md border p-1 ${tone(event.status)}`}
                    >
                      <Icon size={15} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium capitalize text-slate-200">
                          {readableEvent(event.event_type)}
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Clock3 size={12} />
                          {Math.round(event.duration_ms)} ms
                        </span>
                      </span>

                      <span className="mt-1 block text-xs text-slate-500">
                        {event.payload?.purpose ||
                          event.payload?.source ||
                          event.status}
                      </span>

                      <span className="mt-1 block text-[10px] text-slate-600">
                        Step {event.step}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="space-y-4">

          <div className="panel p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">
              Event Details
            </h3>

            {selected ? (
              <>
                <p className="mb-2 text-sm font-medium text-cyan-300">
                  {readableEvent(selected.event_type)}
                </p>

                <div className="mb-3 flex gap-3 text-xs text-slate-500">
                  <span>Status: {selected.status}</span>
                  <span>Step: {selected.step}</span>
                  <span>{Math.round(selected.duration_ms)} ms</span>
                </div>

                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-400">
                    Developer payload
                    <ChevronDown
                      size={14}
                      className="transition-transform group-open:rotate-180"
                    />
                  </summary>

                  <pre className="mt-2 max-h-[300px] overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] leading-5 text-cyan-100">
                    {JSON.stringify(selected.payload || {}, null, 2)}
                  </pre>
                </details>
              </>
            ) : (
              <p className="text-xs text-slate-500">
                Select an event to inspect its details.
              </p>
            )}
          </div>

          <div className="panel p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">
              Root Cause Findings
            </h3>

            {failedEvaluations.length === 0 ? (
              <p className="text-sm text-emerald-400">
                No failed assertions for this test case.
              </p>
            ) : (
              <ul className="space-y-2">
                {failedEvaluations.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3"
                  >
                    <p className="text-xs font-medium text-rose-300">
                      {item.taxonomy || "Failure"} · {item.assertion_name}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-300">
                      {item.failure_reason || "Assertion did not pass."}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
