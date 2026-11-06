import { SAMPLE } from "./sample.js";

export const STAGES = [
  { key: "parse_cv", label: "Reading your CV" },
  { key: "parse_job", label: "Reading the job post" },
  { key: "match", label: "Testing your evidence against the job" },
  { key: "generate", label: "Writing your kit" },
  { key: "verify", label: "Checking every claim" },
];

const TOOL_TIMEOUTS = {
  parse_cv: 65000,
  parse_job: 50000,
  match: 50000,
  generate: 90000,
  verify: 65000,
};

const isSampleRequired = (res) =>
  res && res.success === false && res.data?.code === "SAMPLE_REQUIRED";

const clone = (value) =>
  typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class PipelineError extends Error {
  constructor(code, message, stage, { partial = null, retryable = true } = {}) {
    super(message);
    this.name = "PipelineError";
    this.code = code || "TOOL_ERROR";
    this.stage = stage || "";
    this.partial = partial;
    this.retryable = retryable;
  }
}

export class Pipeline {
  constructor({ host = null, toolId = "tool-dev-hirekit", demo = false } = {}) {
    this.host = host;
    this.toolId = toolId;
    this.demo = demo || !host;
    this.demoAnswers = [];
  }

  async call(tool, args) {
    if (this.demo) return this.demoCall(tool, args);
    let res;
    try {
      res = await this.host.tools.invoke(
        { tool_id: this.toolId, method: tool, args },
        { timeoutMs: TOOL_TIMEOUTS[tool] || 70000 },
      );
    } catch (err) {
      const data = err?.data || {};
      throw new PipelineError(
        data.code || err?.code || "TOOL_ERROR",
        err?.message || "The tool call failed. Try again.",
        tool,
        { retryable: data.retryable !== false },
      );
    }
    if (isSampleRequired(res)) return this.callViaHostLlm(tool, args, res);
    if (res && res.success === false) {
      const data = res.data || {};
      throw new PipelineError(
        data.code || "TOOL_ERROR",
        res.error || "The tool call failed. Try again.",
        tool,
        { retryable: data.retryable !== false },
      );
    }
    if (res && res.success === true) return res.data;
    return res;
  }

  async callViaHostLlm(tool, args, res) {
    if (!this.host?.llm?.complete) {
      throw new PipelineError(
        "SAMPLING_NOT_GRANTED",
        "This app is not allowed to use the host LLM. Turn on AI features for HireKit, or allow access when asked to sign in.",
        tool,
        { retryable: false },
      );
    }
    const params = (res.data || {}).params || {};
    let completion;
    try {
      completion = await this.host.llm.complete(params, { timeoutMs: 180000 });
    } catch (err) {
      const data = err?.data || {};
      throw new PipelineError(
        data.code || err?.code || "APP_PROVIDER_ERROR",
        "The host LLM call failed. Try again.",
        tool,
        { retryable: data.retryable !== false },
      );
    }
    const text = completion?.content?.text || completion?.text || "";
    if (!String(text).trim()) {
      throw new PipelineError(
        "MALFORMED_MODEL_JSON",
        "The model returned an empty response. Try again.",
        tool,
        { retryable: true },
      );
    }
    return this.call(tool, { ...args, precomputed_response: String(text) });
  }

  async demoCall(tool, args) {
    await sleep(420 + Math.random() * 260);
    if (tool === "parse_cv") return clone(SAMPLE.evidence);
    if (tool === "parse_job") return clone(SAMPLE.job);
    if (tool === "match") return clone(SAMPLE.matches);
    if (tool === "generate") {
      const kit = clone(SAMPLE.kit);
      const answered = new Set(
        (Array.isArray(args?.answers) ? args.answers : []).map((a) => a.question_id),
      );
      if (answered.size) {
        kit.needs_input = kit.needs_input.filter((q) => !answered.has(q.id));
        kit.gap_plan = kit.gap_plan.filter((g) => g.requirement_id !== "req_2");
      }
      return kit;
    }
    if (tool === "verify") {
      const kit = clone(SAMPLE.kit);
      const answered = new Set(this.demoAnswers);
      if (answered.size) {
        kit.needs_input = kit.needs_input.filter((q) => !answered.has(q.id));
        kit.gap_plan = kit.gap_plan.filter((g) => g.requirement_id !== "req_2");
      }
      return { kit, lint: clone(SAMPLE.lint) };
    }
    throw new PipelineError("UNKNOWN_TOOL", `Unknown tool: ${tool}`, tool, { retryable: false });
  }

  async run({ cvText, jobText, tone = "direct, warm, specific", level, answers = [], onProgress }) {
    const statuses = STAGES.map((stage) => ({ ...stage, status: "pending" }));
    const emit = () => onProgress?.(statuses.map((stage) => ({ ...stage })));
    const mark = (key, status) => {
      const stage = statuses.find((item) => item.key === key);
      if (stage) stage.status = status;
      emit();
    };
    const partial = {};
    const fail = (err, stage) => {
      const error =
        err instanceof PipelineError
          ? err
          : new PipelineError("TOOL_ERROR", err?.message || "Something went wrong.", stage, {
              partial,
              retryable: true,
            });
      error.stage = error.stage || stage;
      error.partial = error.partial || partial;
      mark(stage, "failed");
      throw error;
    };

    this.demoAnswers = (answers || []).map((a) => a.question_id).filter(Boolean);
    emit();

    mark("parse_cv", "running");
    mark("parse_job", "running");
    const [cvResult, jobResult] = await Promise.allSettled([
      this.call("parse_cv", { cv_text: cvText })
        .then((value) => {
          partial.evidence = value;
          mark("parse_cv", "done");
          return value;
        })
        .catch((err) => {
          mark("parse_cv", "failed");
          throw err;
        }),
      this.call("parse_job", { job_text: jobText })
        .then((value) => {
          partial.job = value;
          mark("parse_job", "done");
          return value;
        })
        .catch((err) => {
          mark("parse_job", "failed");
          throw err;
        }),
    ]);
    if (cvResult.status === "rejected") fail(cvResult.reason, "parse_cv");
    if (jobResult.status === "rejected") fail(jobResult.reason, "parse_job");

    const evidence = cvResult.value;
    const job = jobResult.value;

    mark("match", "running");
    let matches;
    try {
      matches = await this.call("match", { job, evidence });
      partial.matches = matches;
      mark("match", "done");
    } catch (err) {
      fail(err, "match");
    }

    mark("generate", "running");
    let draft;
    try {
      draft = await this.call("generate", { job, matches, evidence, answers, tone, level });
      partial.draft = draft;
      mark("generate", "done");
    } catch (err) {
      fail(err, "generate");
    }

    mark("verify", "running");
    try {
      const final = await this.call("verify", { evidence, job, matches, kit: draft });
      mark("verify", "done");
      return {
        evidence,
        job,
        matches,
        kit: final?.kit || final,
        lint: final?.lint || [],
        answers,
      };
    } catch (err) {
      fail(err, "verify");
    }
  }
}
