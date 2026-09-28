import json, os, re, sys, time, urllib.request, concurrent.futures as cf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.expanduser("~/Projects/JavaScript/devrel-md")
KEY = os.environ["OPENROUTER_API_KEY"]

spec = open(f"{ROOT}/spec/SPEC.md").read()
skill = open(f"{ROOT}/skills/skills/devrel-md-init/SKILL.md").read()
system = (
    "You write DEVREL.md files. Follow the specification and the skill instructions below exactly.\n"
    "This is an unattended run: nobody can answer questions. Do not ask any. Put the questions you would "
    "have asked under an 'Open questions' section.\n"
    "Output ONLY the complete DEVREL.md file content, starting with the '---' frontmatter line. "
    "No preamble, no code fences, no commentary after the file.\n\n"
    "<spec>\n" + spec + "\n</spec>\n\n<skill>\n" + skill + "\n</skill>"
)

pages = [
    ("https://resend.com/docs/llms.txt", "docs_llms.txt", 20000),
    ("https://resend.com/docs/introduction.md", "docs_introduction.md", 12000),
    ("https://resend.com/docs/send-with-nodejs.md", "docs_send-with-nodejs.md", 15000),
    ("https://resend.com/docs/dashboard/domains/introduction.md", "docs_dashboard_domains_introduction.md", 4000),
    ("https://resend.com/docs/api-reference/introduction.md", "docs_api-reference_introduction.md", 4000),
    ("https://resend.com/pricing", "pricing.txt", 8000),
]
user = "Product developer home: https://resend.com\nToday's date: 2026-09-28\n\nPublic pages fetched for you:\n\n"
for url, fn, cap in pages:
    user += f"<page url=\"{url}\">\n{open(os.path.join(HERE, fn)).read()[:cap]}\n</page>\n\n"
user += "Write the DEVREL.md for this product now."

REQUIRED = ["Product", "Value proposition", "ICPs", "Anti-personas", "North Star", "Activation", "Funnel health"]
STAGES = ["Awareness", "Onboarding", "Activation", "Engagement", "Monetization"]

def validate(text):
    problems = []
    t = text.strip()
    if t.startswith("```"):
        problems.append("wrapped in code fence")
        t = re.sub(r"^```[a-z]*\n|\n```$", "", t)
    m = re.match(r"^---\n(.*?)\n---\n", t, re.S)
    if not m:
        return ["no frontmatter"]
    fm = dict(re.findall(r"^(\w+):\s*(.+?)\s*(?:#.*)?$", m.group(1), re.M))
    for k in ["spec", "product", "stage", "updated"]:
        if k not in fm:
            problems.append(f"frontmatter missing {k}")
    if fm.get("stage") not in ["pre-launch", "early", "growth", "scale", "enterprise", "unknown"]:
        problems.append(f"bad stage {fm.get('stage')!r}")
    heads = re.findall(r"^## (.+?)\s*$", t, re.M)
    pos = []
    for r in REQUIRED:
        idx = next((i for i, h in enumerate(heads) if h.lower().startswith(r.lower())), None)
        if idx is None:
            problems.append(f"missing section {r}")
        else:
            pos.append(idx)
    if pos != sorted(pos):
        problems.append("required sections out of order")
    fh = re.search(r"^## Funnel health.*?(?=^## |\Z)", t, re.M | re.S)
    if fh:
        for st in STAGES:
            row = re.search(rf"^\|\s*{st}\s*\|.*\|\s*(\S+)\s*\|\s*$", fh.group(0), re.M)
            if not row:
                problems.append(f"funnel row {st} missing")
            elif row.group(1).lower() not in ["yes", "no", "unknown", "n/a"]:
                problems.append(f"funnel {st} pass={row.group(1)!r}")
    lines = len(t.splitlines())
    if lines < 40 or lines > 400:
        problems.append(f"length {lines} lines")
    return problems

def call(model):
    body = json.dumps({
        "model": model,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "max_tokens": 8000,
        "temperature": 0.2,
        "usage": {"include": True},
    }).encode()
    req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions", data=body, headers={
        "Authorization": f"Bearer {KEY}", "Content-Type": "application/json",
        "HTTP-Referer": "https://devrel.md", "X-Title": "devrel.md bake-off"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=240) as r:
            d = json.load(r)
    except Exception as e:
        return {"model": model, "error": str(e)[:200], "secs": round(time.time() - t0, 1)}
    secs = round(time.time() - t0, 1)
    if "error" in d:
        return {"model": model, "error": str(d["error"])[:200], "secs": secs}
    text = d["choices"][0]["message"].get("content") or ""
    u = d.get("usage", {})
    fn = re.sub(r"[^a-z0-9]+", "-", model.lower()) + ".md"
    open(os.path.join(HERE, "out", fn), "w").write(text)
    return {"model": model, "served": d.get("model"), "secs": secs, "in": u.get("prompt_tokens"),
            "out": u.get("completion_tokens"), "cost": u.get("cost"),
            "finish": d["choices"][0].get("finish_reason"), "problems": validate(text), "file": fn}

if __name__ == "__main__":
    os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
    models = sys.argv[1:]
    with cf.ThreadPoolExecutor(max_workers=4) as ex:
        results = list(ex.map(call, models))
    json.dump(results, open(os.path.join(HERE, "results.json"), "w"), indent=1)
    for r in results:
        print(json.dumps(r))
