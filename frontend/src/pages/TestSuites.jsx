
import { useMemo, useState, useEffect } from "react";
import {
  Play,
  Plus,
  Search,
  FlaskConical,
  Layers3,
  ChevronDown,
  ChevronUp,
  Code2,
  X,
  CheckCircle2,
  Globe,
  ShieldCheck,
  RefreshCw,
  Filter,
  Sparkles,
} from "lucide-react";
import { api } from "../api";

const suiteIcon = (name = "") => {
  const value = name.toLowerCase();

  if (value.includes("web") || value.includes("tinyfish")) return Globe;
  if (value.includes("support") || value.includes("refund")) return ShieldCheck;

  return FlaskConical;
};

export default function TestSuites({ suites = [], versions = [], onRun }) {
  const [suiteId, setSuiteId] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedCases, setExpandedCases] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [name, setName] = useState("");
  const [inputText, setInputText] = useState("");
  const [tags, setTags] = useState("tinyfish,web");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!suites.length) {
      setSuiteId("");
      return;
    }

    if (!suites.some((suite) => suite.id === suiteId)) {
      setSuiteId(suites[0].id);
    }
  }, [suites, suiteId]);

  const selected = suites.find(
    (suite) => suite.id === suiteId
  ) || suites[0];

  const allCases = selected?.cases || [];

  const filteredCases = useMemo(() => {
    return allCases.filter((testCase) => {
      const query = search.toLowerCase();

      const matchesSearch =
        testCase.name?.toLowerCase().includes(query) ||
        testCase.input_text?.toLowerCase().includes(query) ||
        (testCase.tags || []).some((tag) =>
          tag.toLowerCase().includes(query)
        );

      const caseTags = (testCase.tags || []).map((tag) =>
        tag.toLowerCase()
      );

      const matchesFilter =
        activeFilter === "all" ||
        caseTags.includes(activeFilter);

      return matchesSearch && matchesFilter;
    });
  }, [allCases, search, activeFilter]);

  const totalCases = suites.reduce(
    (total, suite) => total + (suite.cases?.length || 0),
    0
  );

  const totalTags = new Set(
    allCases.flatMap((testCase) => testCase.tags || [])
  ).size;

  function toggleExpanded(id) {
    setExpandedCases((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function resetForm() {
    setName("");
    setInputText("");
    setTags("tinyfish,web");
    setMessage("");
    setError("");
  }

  async function addCase(event) {
    event.preventDefault();

    if (!selected) return;

    const cleanTags = tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    setSaving(true);
    setMessage("");
    setError("");

    try {
      await api.createCase(selected.id, {
        name: name.trim(),
        input_text: inputText.trim(),
        tags: cleanTags,
        expected_behaviour: {
          agent_url: "https://example.com",
          agent_goal: inputText.trim(),
          ground_with_fetch: cleanTags.includes("tinyfish"),
          expected_tools: cleanTags.includes("tinyfish")
            ? ["tinyfish.navigate"]
            : ["lookup_order"],
          required_keys: ["ok"],
        },
      });

      setMessage("Test case successfully saved.");
      resetForm();
      setShowAddForm(false);

      // App.jsx refreshes suite data periodically.
    } catch (err) {
      setError(err.message || "Unable to save test case.");
    } finally {
      setSaving(false);
    }
  }

  if (!suites.length) {
    return (
      <div className="panel flex flex-col items-center justify-center p-12 text-center">
        <FlaskConical size={38} className="mb-4 text-slate-500" />
        <h2 className="text-lg font-semibold">No test suites available</h2>
        <p className="mt-2 text-sm text-slate-400">
          Start the backend and seed your project to load test suites.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">

      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-cyan-400">
            <Sparkles size={14} />
            Evaluation workspace
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Test Suites
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Manage test scenarios, inspect expected behaviour, and
            evaluate your AI agents against reliability benchmarks.
          </p>
        </div>

        <button
          type="button"
          onClick={onRun}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-400"
        >
          <Play size={16} />
          Run evaluation
        </button>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <div className="panel relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total suites</p>
              <p className="mt-2 text-3xl font-bold">
                {suites.length}
              </p>
            </div>

            <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400">
              <Layers3 size={23} />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Evaluation groups in this project
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total test cases</p>
              <p className="mt-2 text-3xl font-bold">
                {totalCases}
              </p>
            </div>

            <div className="rounded-xl bg-violet-500/10 p-3 text-violet-400">
              <FlaskConical size={23} />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Across all available suites
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Selected suite tags</p>
              <p className="mt-2 text-3xl font-bold">
                {totalTags}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
              <CheckCircle2 size={23} />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Unique categories in the selected suite
          </p>
        </div>
      </div>

      {/* SUITE SELECTOR */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Your test suites</h2>
            <p className="mt-1 text-xs text-slate-500">
              Select a suite to explore its test cases.
            </p>
          </div>

          <span className="chip border-slate-700 text-slate-400">
            {suites.length} suites available
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {suites.map((suite) => {
            const Icon = suiteIcon(suite.name);
            const isSelected = selected?.id === suite.id;
            const count = suite.cases?.length || 0;

            return (
              <button
                key={suite.id}
                type="button"
                onClick={() => {
                  setSuiteId(suite.id);
                  setSearch("");
                  setActiveFilter("all");
                  setExpandedCases([]);
                }}
                className={`rounded-2xl border p-5 text-left transition duration-200 ${
                  isSelected
                    ? "border-cyan-500/50 bg-cyan-500/[0.07] shadow-lg shadow-cyan-950/20"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`rounded-xl p-3 ${
                    isSelected
                      ? "bg-cyan-500/15 text-cyan-300"
                      : "bg-slate-800 text-slate-400"
                  }`}>
                    <Icon size={22} />
                  </div>

                  {isSelected ? (
                    <span className="chip border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                      Selected
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">
                      Select suite →
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-base font-semibold text-slate-100">
                  {suite.name}
                </h3>

                <p className="mt-2 min-h-10 text-sm leading-6 text-slate-400">
                  {suite.description || "No description available."}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
                  <span className="flex items-center gap-2 text-xs text-slate-400">
                    <FlaskConical size={14} />
                    {count} test cases
                  </span>

                  <span className="text-xs font-medium text-cyan-400">
                    View cases
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SELECTED SUITE CONTENT */}
      {selected && (
        <section className="space-y-4">

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">
                  {selected.name}
                </h2>

                <span className="chip border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                  Active suite
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                {allCases.length} scenarios configured for evaluation
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddForm((value) => !value);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-cyan-500/50 hover:text-cyan-300"
            >
              {showAddForm ? <X size={16} /> : <Plus size={16} />}
              {showAddForm ? "Close form" : "Add test case"}
            </button>
          </div>

          {/* ADD CASE FORM */}
          {showAddForm && (
            <form
              onSubmit={addCase}
              className="panel space-y-4 border-cyan-500/20 p-5"
            >
              <div>
                <h3 className="font-semibold">Create a test case</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Add a new scenario to {selected.name}.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2 text-sm text-slate-300">
                  Test case name

                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Verify refund eligibility"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                  />
                </label>

                <label className="block space-y-2 text-sm text-slate-300">
                  Tags

                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="support, refund, policy"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                  />

                  <span className="text-xs text-slate-500">
                    Separate tags with commas.
                  </span>
                </label>
              </div>

              <label className="block space-y-2 text-sm text-slate-300">
                Agent input / test scenario

                <textarea
                  required
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Describe the task or scenario the AI agent must handle..."
                  rows={4}
                  className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                />
              </label>

              {error && (
                <p className="text-sm text-rose-400">{error}</p>
              )}

              {message && (
                <p className="text-sm text-emerald-400">{message}</p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  The test case will be stored in your database.
                </p>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={16} />
                  {saving ? "Saving..." : "Save test case"}
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Agent versions:{" "}
                {versions.map((version) => version.name).join(", ") || "None"}
              </p>
            </form>
          )}

          {/* SEARCH AND FILTERS */}
          <div className="panel flex flex-wrap items-center gap-3 p-3">
            <div className="relative min-w-[200px] flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search test cases..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 text-slate-500">
              <Filter size={15} />
              <span className="text-xs">Filter:</span>
            </div>

            {["all", ...new Set(
              allCases.flatMap((testCase) =>
                (testCase.tags || []).map((tag) => tag.toLowerCase())
              )
            )].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeFilter === filter
                    ? "bg-cyan-500/15 text-cyan-300"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {filter === "all" ? "All cases" : filter}
              </button>
            ))}
          </div>

          {/* CASE LIST */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">
              Test scenarios
            </h3>

            <span className="text-xs text-slate-500">
              Showing {filteredCases.length} of {allCases.length}
            </span>
          </div>

          <div className="space-y-3">
            {filteredCases.map((testCase, index) => {
              const expanded = expandedCases.includes(testCase.id);

              return (
                <article
                  key={testCase.id}
                  className="panel overflow-hidden transition hover:border-slate-700"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-semibold text-slate-400">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-slate-100">
                            {testCase.name}
                          </h4>

                          {(testCase.tags || []).map((tag) => (
                            <span
                              key={tag}
                              className={`chip ${
                                tag.toLowerCase().includes("tinyfish") ||
                                tag.toLowerCase().includes("web")
                                  ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                                  : "border-slate-700 bg-slate-800/50 text-slate-400"
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-400">
                          {testCase.input_text}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpanded(testCase.id)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        aria-label={expanded ? "Collapse details" : "Expand details"}
                      >
                        {expanded
                          ? <ChevronUp size={18} />
                          : <ChevronDown size={18} />
                        }
                      </button>
                    </div>

                    {expanded && (
                      <div className="mt-5 border-t border-slate-800 pt-4">
                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                          <Code2 size={15} />
                          Expected behaviour
                        </div>

                        <pre className="max-h-80 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-300">
                          {JSON.stringify(
                            testCase.expected_behaviour || {},
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}

            {filteredCases.length === 0 && (
              <div className="panel flex flex-col items-center p-10 text-center">
                <Search size={26} className="mb-3 text-slate-500" />
                <h3 className="font-medium">No matching test cases</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try another search term or change the selected filter.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveFilter("all");
                  }}
                  className="mt-4 text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

        </section>
      )}
    </div>
  );
}
