import type { Repo, ContentType } from './types';

function desc(repo: Repo): string {
  return repo.description ?? 'an open-source security tool by Trail of Bits';
}

function starsLabel(stars: number): string {
  if (stars === 0) return 'brand new';
  if (stars < 100) return `${stars} GitHub stars`;
  return `${stars.toLocaleString()}+ GitHub stars`;
}

function isRecentlyActive(repo: Repo): boolean {
  return (Date.now() - new Date(repo.pushedAt).getTime()) / 86400000 < 90;
}

function topicsStr(repo: Repo, max = 4): string {
  return repo.topics.slice(0, max).join(', ');
}

function langPhrase(repo: Repo): string {
  return repo.language ? ` Written in ${repo.language}.` : '';
}

function primaryTopic(repo: Repo): string {
  return repo.topics[0] ?? 'security';
}

function lastPushMonth(repo: Repo): string {
  return new Date(repo.pushedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

// Extract install commands and usage blocks from a README string
function extractReadmeSnippets(readme: string): { install: string; usage: string } {
  if (!readme) return { install: '', usage: '' };

  const lines = readme.split('\n');
  let install = '';
  let usage = '';

  // Find installation section
  const installIdx = lines.findIndex(l =>
    /^#{1,3}\s*(install|installation|getting started|setup|quick ?start)/i.test(l)
  );
  if (installIdx !== -1) {
    const section = lines.slice(installIdx + 1, installIdx + 40).join('\n');
    const codeMatch = section.match(/```[\w]*\n([\s\S]+?)```/);
    if (codeMatch) install = codeMatch[1].trim().slice(0, 600);
  }

  // Find usage section
  const usageIdx = lines.findIndex(l =>
    /^#{1,3}\s*(usage|use|example|quick ?start|getting started)/i.test(l)
  );
  if (usageIdx !== -1 && usageIdx !== installIdx) {
    const section = lines.slice(usageIdx + 1, usageIdx + 50).join('\n');
    const codeMatch = section.match(/```[\w]*\n([\s\S]+?)```/);
    if (codeMatch) usage = codeMatch[1].trim().slice(0, 600);
  }

  // Fallback: grab first code block
  if (!install) {
    const firstBlock = readme.match(/```[\w]*\n([\s\S]+?)```/);
    if (firstBlock) install = firstBlock[1].trim().slice(0, 400);
  }

  return { install, usage };
}

export function generateContent(repo: Repo, contentType: ContentType, variation = 0, readme = ''): string {
  const { name, htmlUrl: url, stars, language } = repo;
  const d = desc(repo);
  const lang = language ?? 'multiple languages';
  const starsStr = stars.toLocaleString();
  const active = isRecentlyActive(repo);
  const topic = primaryTopic(repo);
  const topics = repo.topics.slice(0, 4);
  const topicList = topics.length ? topicsStr(repo) : 'security, open-source';

  switch (contentType) {
    case 'tweet-short': {
      const full = `${name} — ${d} 🔓 Open-source by @trailofbits. ${url}`;
      if (full.length <= 280) return full;
      const budget = 280 - `${name} —  🔓 Open-source by @trailofbits. ${url}`.length;
      const shortDesc = d.length > budget ? d.slice(0, budget - 1) + '…' : d;
      return `${name} — ${shortDesc} 🔓 Open-source by @trailofbits. ${url}`;
    }

    case 'tweet-thread':
      return [
        `1/ Security teams: are you getting full coverage from your tooling? ${name} from @trailofbits tackles exactly the gaps most teams don't know they have.`,
        `2/ ${name} is ${d}${lang !== 'multiple languages' ? ` (${lang})` : ''}. Free and open-source. ${url}`,
        `3/ Trail of Bits builds tools like this because real security gaps need real engineering solutions — not just documentation. ${name} is one of them.`,
        `4/ With ${starsLabel(stars)} on GitHub${active ? ' and active development' : ''}, ${name} has proven useful to security researchers and engineers worldwide.${topics.length ? ` Key areas: ${topicList}.` : ''}`,
        `5/ If you work in ${topic} or need to audit${lang !== 'multiple languages' ? ` ${lang}` : ''} codebases, ${name} belongs in your toolkit.`,
        `6/ Star it, fork it, or contribute:\n${url}\n\nQuestions? The @trailofbits team is active on GitHub Issues.`,
      ].join('\n\n');

    case 'linkedin':
      return `Most security tooling is either too academic to use in practice or too shallow to catch what matters. ${name} sits in neither camp.

${name} is ${d}. It was built by Trail of Bits — the security research firm behind some of the most widely-used open-source security tools in the industry.

What makes it worth your time:
• ${active ? 'Actively maintained' : 'Battle-tested'} and open-source under the Trail of Bits umbrella
• Built in ${lang}${topics.length ? ` with a focus on ${topics.slice(0, 2).join(' and ')}` : ''}
• ${stars > 0 ? `${starsStr} GitHub stars — trusted by the security community` : 'Brand new — be among the first to explore it'}

Whether you're securing production infrastructure, auditing third-party code, or building internal tooling, ${name} is worth a look.

→ Explore it on GitHub: ${url}

#security #opensource #devtools`;

    case 'blog-outline':
      return `# Blog Post Outline: ${name}

**Title:** ${name}: ${d}
**Meta description:** Learn how ${name} from Trail of Bits helps security engineers ${d.toLowerCase().includes('detect') || d.toLowerCase().includes('analyz') ? 'detect and analyze threats' : 'improve security posture'}. Free and open-source. (~150 chars)

---

## 1. Introduction (~150 words)
- Hook: open with the problem this tool solves — what breaks without it?
- Introduce ${name} in one sentence
- Why Trail of Bits built it
- Preview what readers will learn

## 2. Background: The Problem (~200 words)
- What gap does ${name} address in the ${topic} ecosystem?
- Who feels this pain most (security engineers, developers, auditors)?
- What existing approaches fall short?

## 3. How ${name} Works (~300 words)
- Architecture overview${lang !== 'multiple languages' ? ` (written in ${lang})` : ''}
- Core components and what each does
- Key technical differentiator
- Diagram suggestion: data flow or component map

## 4. Use Cases (~250 words)
- Use case 1: audit/review workflow
- Use case 2: CI/CD integration for continuous security checks
${topics.length > 1 ? `- Use case 3: ${topics[1].charAt(0).toUpperCase() + topics[1].slice(1)}-specific scenario` : '- Use case 3: custom integration scenario'}

## 5. Getting Started (~200 words)
\`\`\`bash
git clone ${url}
cd ${name}
# see README for install steps
\`\`\`
- Prerequisites
- Quickstart example with sample output
- Link to full documentation

## 6. Conclusion + Next Steps (~100 words)
- Recap of why ${name} matters
- Invite contributions at ${url}
- Related Trail of Bits tools to explore

---
**Total target:** ~1,200 words
**Internal links:** Trail of Bits blog, related tools
**External links:** ${url}`;

    case 'blog-full':
      return `# ${name}: ${d}

Trail of Bits has a long history of building security tooling that fills gaps the industry ignores. **${name}** is one of those tools — ${d.toLowerCase()}.

## The Problem

Security teams and developers face a persistent challenge: ${topics.length ? `working with ${topic} at scale` : 'keeping pace with an ever-expanding attack surface'} without sacrificing speed or coverage. Most tools in this space either require deep configuration expertise or only scratch the surface of what's actually dangerous.

${name} was built to do better.

## What Is ${name}?

${name} is an open-source tool from [Trail of Bits](https://www.trailofbits.com/) — ${d}.${langPhrase(repo)}${topics.length ? ` It covers areas including ${topicList}.` : ''}

It was designed for security engineers, developers, and researchers who need ${topics.length ? `reliable ${topic} tooling` : 'reliable security tooling'} they can trust in production.

## How It Works

At its core, ${name} takes a systematic approach to ${topic}. Rather than relying on heuristics alone, it:

- Provides structured analysis of the target
- Surfaces actionable findings — not just noise
- Integrates cleanly into existing workflows${lang !== 'multiple languages' ? `\n- Leverages the ${lang} ecosystem for extensibility` : ''}

The result is a tool that gives teams confidence rather than false positives.

## Use Cases

**Code auditing and review**
Security engineers can use ${name} as part of their audit workflow to quickly characterise a codebase and identify areas that need deeper manual review.

**CI/CD integration**
Add ${name} to your pipeline to catch issues before they reach production. It runs fast enough for pre-merge checks and produces output that's easy to parse and act on.

${topics.length > 1 ? `**${topics[1].charAt(0).toUpperCase() + topics[1].slice(1)} workflows**\nTeams working in ${topics[1]} will find ${name} especially useful — it was designed with these scenarios in mind.\n` : ''}
## Getting Started

\`\`\`bash
git clone ${url}
cd ${name}
# follow README for full setup
\`\`\`

For installation instructions, examples, and full documentation, visit the [GitHub repository](${url}).

${stars > 100 ? `With ${starsStr} GitHub stars, ${name} has already earned a following in the security community.` : `${name} is ${repo.isNew ? 'brand new' : 'actively developed'} — now is a great time to get in early and shape its direction.`}

## Conclusion

Security tooling lives or dies by whether practitioners actually reach for it. ${name} earns that trust by being focused, well-engineered, and open-source.

If your team works on ${topics.length ? topicList : 'security'}, it belongs in your toolkit.

→ **[Explore ${name} on GitHub](${url})**${repo.isHiddenGem ? '\n\n*This is a Hidden Gem — high activity, low blog visibility. Help spread the word.*' : ''}`;

    case 'newsletter':
      return `**${name}** — ${d}${langPhrase(repo)} Open-source from Trail of Bits with ${starsLabel(stars)}.${topics.length ? ` Topics: ${topicList}.` : ''}

${active ? 'Actively maintained and' : 'A proven tool that is'} worth a look if you work in ${topic} — the Trail of Bits team built it to solve a real gap, not just to ship something. It's free, forkable, and ready to integrate.

→ Check it out: ${url}`;

    case 'pr-pitch':
      return `**HEADLINE:** Trail of Bits Open-Sources ${name} — A New Tool for ${topic.charAt(0).toUpperCase() + topic.slice(1)} Engineers

**SUBHEADLINE:** The security research firm adds ${name} to its growing portfolio of open-source tools targeting real-world engineering gaps.

**LEDE PARAGRAPH:**
Trail of Bits, the security research firm known for its work on high-profile audits and open-source tooling, has released ${name} — ${d}. The tool is available now on GitHub at no cost under an open-source licence, and is designed for security engineers and developers who need ${topics.length ? `reliable ${topic} tooling` : 'reliable security tooling'} without vendor lock-in.

**KEY POINTS:**
- **Technical significance:** ${name} addresses a gap in ${topic} that existing solutions handle poorly — giving practitioners a free, auditable alternative${lang !== 'multiple languages' ? ` built in ${lang}` : ''}
- **Industry relevance:** With ${starsLabel(stars)} and ${active ? 'active development' : 'a stable release'}, ${name} has demonstrated adoption across the security research and engineering community
- **Availability:** Fully open-source and available immediately at ${url} — no account, no licence key, no cost

**QUOTE PLACEHOLDER:**
[Insert quote from Trail of Bits engineer: "We built ${name} because we kept running into the same problem on client engagements. The tools that existed either didn't go deep enough or required too much setup. ${name} fixes that."]

**BOILERPLATE:**
Trail of Bits is a security research and consulting firm that has conducted hundreds of assessments for clients including leading technology companies, blockchain projects, and government agencies. The firm is also known for publishing open-source security tools and research at trailofbits.com.

**CONTACT:** press@trailofbits.com | ${url}`;

    case 'technical-faq':
      return `**Q: What is ${name} and what does it do?**
A: ${name} is ${d}. It is developed and maintained by Trail of Bits, a security research firm, and is available as a free open-source tool at ${url}.${lang !== 'multiple languages' ? ` It is written in ${lang}.` : ''}

**Q: Who should use ${name} and for what use cases?**
A: ${name} is designed for security engineers, developers, and researchers who need ${topics.length ? `reliable tooling for ${topic}` : 'reliable security tooling'}. Common use cases include code audits, security reviews, and integrating ${topic} checks into CI/CD pipelines. It is particularly valuable for teams${topics.length > 1 ? ` working across ${topics.slice(0, 2).join(' and ')}` : ' that need an open-source alternative to commercial security tools'}.

**Q: How does ${name} work at a technical level?**
A: ${name} takes a systematic approach to ${topic}${lang !== 'multiple languages' ? `, implemented in ${lang}` : ''}. It analyses its input, applies structured checks based on Trail of Bits' security expertise, and surfaces actionable findings. The implementation is open-source and fully auditable at ${url}.

**Q: How does ${name} compare to similar tools?**
A: Unlike many tools in this space, ${name} was built from direct security research and consulting experience at Trail of Bits. It prioritises precision and actionable output over broad heuristic coverage. It is fully open-source${lang !== 'multiple languages' ? `, written in ${lang}` : ''}, meaning it can be audited, extended, and integrated without vendor constraints.

**Q: How do I get started with ${name}?**
A: Visit the GitHub repository at ${url} for installation instructions, documentation, and examples. The project README covers prerequisites, setup steps, and quickstart usage. For issues or questions, the Trail of Bits team is responsive on GitHub Issues.

**Q: Is ${name} actively maintained and production-ready?**
A: ${name} is maintained by Trail of Bits and was last updated in ${lastPushMonth(repo)}. It has ${starsLabel(stars)} on GitHub. ${active ? 'The project has seen recent commits and is actively developed.' : 'The core functionality is stable — check the GitHub repository for the latest maintenance status.'} For production use, review the project's issue tracker and changelog for known limitations.`;

    case 'testing-guide': {
      const { install, usage } = extractReadmeSnippets(readme);
      const installBlock = install
        ? `\`\`\`bash\n${install}\n\`\`\``
        : `\`\`\`bash\n# Clone the repository\ngit clone ${url}\ncd ${name}\n\n# Install dependencies\n${lang === 'Python' ? 'pip install -e ".[dev]"\n# or: pip install -r requirements.txt' : lang === 'Rust' ? 'cargo build --release' : lang === 'Go' ? 'go build ./...' : lang === 'TypeScript' || lang === 'JavaScript' ? 'npm install' : '# See README for install steps'}\n\`\`\``;
      const usageBlock = usage
        ? `\`\`\`bash\n${usage}\n\`\`\``
        : `\`\`\`bash\n# See the README at ${url} for usage examples\n\`\`\``;
      const testCmd = lang === 'Python' ? 'pytest tests/ -v' : lang === 'Rust' ? 'cargo test' : lang === 'Go' ? 'go test ./...' : lang === 'TypeScript' || lang === 'JavaScript' ? 'npm test' : '# See README for test command';

      return `# Testing Guide: ${name}

> **Repo:** [${url}](${url})
> **Language:** ${lang !== 'multiple languages' ? lang : 'See README'}  |  **Last pushed:** ${lastPushMonth(repo)}  |  **Stars:** ${starsLabel(stars)}

---

## Prerequisites

- **${lang !== 'multiple languages' ? lang : 'Runtime'}** installed and available on your PATH
- Git installed
- ${topic.includes('fuzz') || topic.includes('analysis') ? 'Minimum 4 cores / 8 GB RAM recommended for analysis workloads' : 'Standard development machine — no special hardware required'}
- (Optional) A target codebase or contract to run ${name} against${lang === 'Python' ? '\n- Recommended: Python 3.8+, create a virtual environment first (`python -m venv .venv && source .venv/bin/activate`)' : ''}

## Step 1 — Install

${installBlock}

## Step 2 — Verify the installation

\`\`\`bash
${testCmd}
\`\`\`

All tests should pass. If you see failures, open an issue at ${url}/issues with your environment details.

## Step 3 — Run ${name} on a real target

${usageBlock}

${topic ? `**What to look for:** ${name} focuses on ${topicList}. A successful run will surface specific, actionable findings rather than generic warnings. Note any false positives — these are worth reporting upstream.` : ''}

## Step 4 — Stress-test it

| Test case | Expected behaviour |
|-----------|-------------------|
| Empty / minimal input | Exits cleanly with a clear message, no crash |
| Large codebase / long input | Completes within a reasonable time; logs progress |
| Malformed / invalid input | Returns a non-zero exit code with a descriptive error |
| CI mode (no TTY) | Produces machine-parseable output; does not hang |

## Step 5 — Write up your findings

After testing, document:
1. **What worked well** — findings that matched real vulnerabilities or issues
2. **False positive rate** — how much noise vs signal did you get?
3. **Performance** — time and memory on your target
4. **Integration friction** — what would you change to make it fit your workflow?

Share your write-up on GitHub Discussions at ${url} or open a PR improving the docs.

## Filing a bug report

Include in your issue:
- Exact command and arguments
- Minimal reproducing input (stripped of sensitive data)
- Full stdout/stderr
- ${lang !== 'multiple languages' ? `\`${lang === 'Python' ? 'python --version' : lang === 'Rust' ? 'rustc --version' : lang === 'Go' ? 'go version' : 'node --version'}\` output` : 'Runtime version'}
- OS and architecture (\`uname -a\`)

→ **[Open an issue](${url}/issues)**`;
    }



    case 'tool-review': {
      const { install: ri, usage: ru } = extractReadmeSnippets(readme);
      return `# Tool Review: ${name}

| | |
|---|---|
| **Repository** | [${url}](${url}) |
| **Organisation** | Trail of Bits — ${repo.org} |
| **Language** | ${lang !== 'multiple languages' ? lang : 'Multiple'} |
| **Stars** | ${starsLabel(stars)} |
| **Last commit** | ${lastPushMonth(repo)} |
| **Status** | ${active ? 'Actively maintained' : 'Stable / maintenance mode'} |
| **Topics** | ${topicList || '—'} |

---

## What is ${name}?

${name} is ${d}. It is developed and maintained by Trail of Bits, a security research firm whose open-source tools are tested on real client engagements before being published.${langPhrase(repo)}

## Installation

${ri ? `From the README:\n\n\`\`\`bash\n${ri}\n\`\`\`` : `\`\`\`bash\ngit clone ${url}\ncd ${name}\n# See README for install steps\n\`\`\``}

## How it works

${name} targets the ${topic} problem space${topics.length > 1 ? `, with particular depth in ${topics.slice(0, 2).join(' and ')}` : ''}. Rather than applying broad heuristics, it:

- Analyses its input with structured, auditable logic
- Surfaces findings that are specific and actionable — not just surface-level warnings
- Integrates into existing workflows${lang !== 'multiple languages' ? ` via the ${lang} ecosystem` : ' without requiring a dedicated runtime'}

${ru ? `### Example usage\n\n\`\`\`bash\n${ru}\n\`\`\`` : ''}

## Strengths

**Focused scope.** ${name} solves one problem well instead of trying to be a general-purpose framework. The API surface is small, which means fewer surprises and easier integration.

**Auditable implementation.** Because it is fully open-source${lang !== 'multiple languages' ? ` and written in ${lang}` : ''}, you can inspect exactly what it does and why — a meaningful advantage over commercial black-box tools in high-assurance environments.

**Real-world validation.** Trail of Bits uses these tools on paid security engagements. ${name} has been tested against production codebases, not just CTF samples.

## Limitations

**Documentation assumes domain knowledge.** The README is technically accurate but written for practitioners. New users will benefit from reading the source alongside the docs.

**Community size.** With ${starsLabel(stars)}, ${stars > 1000 ? 'the community is established and finding help is straightforward' : 'the community is focused — for complex issues, GitHub Issues is the most reliable channel'}.

**Maintenance cadence.** Last updated ${lastPushMonth(repo)}. ${active ? 'Active development is ongoing.' : 'The core is stable; verify open issues before adding it to a critical pipeline.'}

## Verdict

${name} is a technically sound choice for security engineers, auditors, and developers who need ${topics.length ? `${topic} tooling` : 'security tooling'} they can trust, extend, and ship. It rewards the time investment to understand it.

**Best suited for:** Teams in ${topics.length ? topicList : 'security-sensitive environments'} who value auditability and open-source supply-chain transparency over commercial convenience.

→ **[Explore ${name} on GitHub](${url})**`;
    }
  }
}
