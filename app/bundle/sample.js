export const SAMPLE = {
  jobText: `Northwind Payments builds payment APIs for African merchants.

You will:
- Build and maintain REST APIs in Node.js or Python
- Design PostgreSQL schemas and tune slow queries
- Ship with Docker and CI/CD
- Write unit and integration tests

Nice to have: Kafka or RabbitMQ, AWS or GCP.`,
  cvText: `Ada Eze | adaeze@example.com | github.com/adaeze | Final-year Computer Science

Projects
Campus Marketplace API (Node.js, Express, PostgreSQL, Jest, Docker, GitHub Actions): designed a 9-table schema, wrote the REST layer, reached 74% test coverage, and deployed on a free-tier VPS.

Experience
Backend intern, a logistics startup: built delivery-status endpoints in Express.`,
  profile: {
    name: "Ada Eze",
    email: "adaeze@example.com",
    links: [{ label: "GitHub", url: "https://github.com/adaeze" }],
  },
  evidence: {
    contact: {
      name: "Ada Eze",
      email: "adaeze@example.com",
      phone: "",
      links: [{ label: "GitHub", url: "https://github.com/adaeze" }],
    },
    language: "en",
    items: [
      {
        id: "proj_1",
        type: "project",
        title: "Campus Marketplace API",
        org: "University",
        dates: "2025",
        facts: [
          "Designed a 9-table PostgreSQL schema.",
          "Built the REST layer in Node.js and Express.",
          "Reached 74% Jest coverage and shipped with Docker and GitHub Actions.",
        ],
        skills: ["Node.js", "Express", "PostgreSQL", "Jest", "Docker", "GitHub Actions"],
        stack: ["Node.js", "Express", "PostgreSQL", "Jest", "Docker", "GitHub Actions"],
        links: [{ label: "GitHub", url: "https://github.com/adaeze/marketplace-api" }],
        metrics: [
          { text: "9-table schema", value: "9" },
          { text: "74% test coverage", value: "74%" },
        ],
        source_quote:
          "Campus Marketplace API (Node.js, Express, PostgreSQL, Jest, Docker, GitHub Actions): designed a 9-table schema, wrote the REST layer, reached 74% test coverage, and deployed on a free-tier VPS.",
        verified_quote: true,
      },
      {
        id: "exp_1",
        type: "experience",
        title: "Backend Intern",
        org: "Logistics startup",
        dates: "2025",
        facts: ["Built delivery-status endpoints in Express."],
        skills: ["Express", "Node.js"],
        stack: ["Express", "Node.js"],
        links: [],
        metrics: [],
        source_quote:
          "Backend intern, a logistics startup: built delivery-status endpoints in Express.",
        verified_quote: true,
      },
    ],
  },
  job: {
    title: "Junior Backend Engineer",
    company: "Northwind Payments",
    location: "Remote",
    seniority: "junior",
    deadline: "",
    keywords: ["Node.js", "Python", "REST", "PostgreSQL", "Docker", "CI/CD", "Jest", "Kafka", "RabbitMQ", "AWS", "GCP"],
    requirements: [
      { id: "req_1", text: "Build REST APIs in Node.js or Python", kind: "must", category: "framework", keywords: ["Node.js", "Python", "REST"] },
      { id: "req_2", text: "PostgreSQL schema design and query tuning", kind: "must", category: "database", keywords: ["PostgreSQL"] },
      { id: "req_3", text: "Docker and CI/CD", kind: "must", category: "infra", keywords: ["Docker", "CI/CD"] },
      { id: "req_4", text: "Unit and integration tests", kind: "must", category: "practice", keywords: ["Jest"] },
      { id: "req_5", text: "Message queues (Kafka, RabbitMQ)", kind: "nice", category: "infra", keywords: ["Kafka", "RabbitMQ"] },
      { id: "req_6", text: "Cloud (AWS or GCP)", kind: "nice", category: "infra", keywords: ["AWS", "GCP"] },
    ],
  },
  matches: {
    matches: [
      { requirement_id: "req_1", status: "covered", evidence_ids: ["proj_1", "exp_1"], rationale: "REST layer in Express and delivery-status endpoints." },
      { requirement_id: "req_2", status: "partial", evidence_ids: ["proj_1"], rationale: "Schema design shown. No evidence of query tuning." },
      { requirement_id: "req_3", status: "covered", evidence_ids: ["proj_1"], rationale: "Docker and GitHub Actions in the marketplace project." },
      { requirement_id: "req_4", status: "covered", evidence_ids: ["proj_1"], rationale: "74% Jest coverage." },
      { requirement_id: "req_5", status: "gap", evidence_ids: [], rationale: "No message-queue evidence." },
      { requirement_id: "req_6", status: "partial", evidence_ids: ["proj_1"], rationale: "Free-tier VPS, not a major cloud." },
    ],
    fit: {
      score: 78,
      band: "Good fit",
      summary: "Your marketplace API covers most must-haves. Query tuning and message queues are the gaps that matter.",
      strengths: [
        "REST APIs — Campus Marketplace API, Backend Intern",
        "Docker and CI/CD — Campus Marketplace API",
        "Unit and integration tests — Campus Marketplace API",
      ],
      risks: ["Gap: Message queues (Kafka, RabbitMQ)", "Partial: PostgreSQL query tuning", "Claim risk: Cloud is a free-tier VPS"],
    },
    keyword_coverage: {
      found: ["Node.js", "REST", "PostgreSQL", "Docker", "CI/CD", "Jest", "Express", "GitHub Actions"],
      missing: ["Python", "Kafka", "RabbitMQ", "AWS", "GCP"],
    },
    claim_risks: [],
  },
  kit: {
    fit: {
      score: 78,
      band: "Good fit",
      summary: "Your marketplace API covers most must-haves. Query tuning and message queues are the gaps that matter.",
      strengths: [
        "REST APIs — Campus Marketplace API, Backend Intern",
        "Docker and CI/CD — Campus Marketplace API",
        "Unit and integration tests — Campus Marketplace API",
      ],
      risks: ["Gap: Message queues (Kafka, RabbitMQ)", "Partial: PostgreSQL query tuning", "Claim risk: Cloud is a free-tier VPS"],
    },
    bullets: [
      {
        text: "Built a REST API in Node.js and Express over a 9-table PostgreSQL schema for a campus marketplace; shipped with Docker and GitHub Actions at 74% Jest coverage.",
        before: "Built a backend for a campus marketplace using Node and Postgres.",
        evidence_ids: ["proj_1"],
        targets: ["req_1", "req_2", "req_3", "req_4"],
        needs_number: false,
      },
      {
        text: "Built delivery-status REST endpoints in Express during a backend internship at a logistics startup.",
        before: "Made delivery endpoints at internship.",
        evidence_ids: ["exp_1"],
        targets: ["req_1"],
        needs_number: true,
      },
    ],
    cover_letter: {
      paragraphs: [
        { text: "Dear Northwind Payments team,", kind: "greeting", evidence_ids: [] },
        { text: "I am a final-year Computer Science student who builds backends end to end. For my Campus Marketplace API I designed a 9-table PostgreSQL schema, wrote the REST layer in Express, and shipped it with Docker and GitHub Actions at 74% Jest coverage.", evidence_ids: ["proj_1"], kind: "body" },
        { text: "At a logistics startup I built delivery-status endpoints in Express, so I have shipped code for people other than me. I have not yet run a message queue in production; I am building a small RabbitMQ worker to close that gap.", evidence_ids: ["exp_1"], kind: "body" },
        { text: "I would welcome the chance to talk about the Junior Backend Engineer role.", evidence_ids: [], kind: "body" },
        { text: "Sincerely,\nAda Eze", kind: "closing", evidence_ids: [] },
      ],
    },
    outreach: {
      subject: "Junior Backend Engineer application",
      message: "Hi, I applied for the Junior Backend Engineer role. I built a REST API on PostgreSQL with Docker and CI (github.com/adaeze/marketplace-api). Happy to walk through the schema if useful.",
      evidence_ids: ["proj_1"],
    },
    interview: [
      {
        question: "Walk me through the schema of your marketplace project.",
        why_asked: "You list PostgreSQL, so expect depth.",
        answer_outline: ["Name the 9 tables and the key relations", "Explain one index you added and why", "State one design change you would make now"],
        evidence_ids: ["proj_1"],
      },
      {
        question: "How did your CI pipeline catch bugs?",
        why_asked: "CI/CD is a must-have.",
        answer_outline: ["What ran on each push", "One failure it caught", "What you would add next"],
        evidence_ids: ["proj_1"],
      },
      {
        question: "What is a message queue and when would you use one?",
        why_asked: "Gap. Be honest and show learning.",
        answer_outline: ["Decouple producer and consumer", "Retry and ordering trade-offs", "Your RabbitMQ worker plan"],
        evidence_ids: [],
      },
    ],
    gap_plan: [
      { requirement_id: "req_5", honest_phrasing: "Currently building a RabbitMQ worker project.", action: "Build a job-queue demo with retries and dead-letter handling.", effort: "8 hours" },
      { requirement_id: "req_2", honest_phrasing: "Add only if true after answering the question above.", action: "Seed 100k rows, add an index, compare EXPLAIN output, write it up in the README.", effort: "3 hours" },
    ],
    needs_input: [
      {
        id: "q_req_2",
        question: "The job asks for query tuning. Did you add an index or read an EXPLAIN plan on the marketplace project?",
        relates_to: "req_2",
      },
    ],
  },
  lint: [
    { status: "pass", message: "Single column, text-extractable links.", line: "" },
    { status: "pass", message: "GitHub link found in header.", line: "" },
    { status: "partial", message: "2 bullets have no numbers (add real ones).", line: "" },
  ],
  tracker: [
    { id: "t_1", role: "Frontend Intern", company: "Orbit Labs", status: "Saved", score: 64, deadline: "", notes: "", kitId: "" },
    { id: "t_2", role: "Junior Backend Engineer", company: "Northwind Payments", status: "Applied", score: 78, deadline: "Closes Nov 20", notes: "", kitId: "" },
    { id: "t_3", role: "QA Automation Intern", company: "Helix Systems", status: "Interview", score: 71, deadline: "Round 1 Nov 12", notes: "", kitId: "" },
    { id: "t_4", role: "Platform Engineer", company: "Lattice Cloud", status: "Closed", score: 41, deadline: "", notes: "", kitId: "" },
  ],
};
