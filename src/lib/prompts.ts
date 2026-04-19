import type { Repo, ContentType } from './types';

function repoContext(repo: Repo): string {
  return [
    `Repository: ${repo.name}`,
    `Organization: ${repo.org} (Trail of Bits)`,
    `Description: ${repo.description ?? 'No description provided'}`,
    `GitHub Stars: ${repo.stars.toLocaleString()} (community interest/adoption metric)`,
    `Primary Language: ${repo.language ?? 'Not specified'}`,
    `Topics/Tags: ${repo.topics.length ? repo.topics.join(', ') : 'None listed'}`,
    `Last Updated: ${new Date(repo.pushedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    `GitHub URL: ${repo.htmlUrl}`,
  ].join('\n');
}

export function buildPrompt(repo: Repo, contentType: ContentType): string {
  const ctx = repoContext(repo);

  switch (contentType) {
    case 'tweet-short':
      return `You are a technical content writer for Trail of Bits, a leading security research firm.

Write a single tweet (maximum 280 characters) promoting the open-source tool "${repo.name}".

${ctx}

Requirements:
- Maximum 280 characters including spaces
- Engaging and punchy opening
- Mention what the tool does in plain terms
- Include the GitHub URL at the end
- Technical but accessible tone — security researchers AND developers should find it interesting
- No more than 2 hashtags if any (only use highly relevant ones like #security, #opensource)
- Do NOT use filler phrases like "Excited to share" or "Thrilled to announce"

Output only the tweet text, nothing else.`;

    case 'tweet-thread':
      return `You are a technical content writer for Trail of Bits, a leading security research firm.

Write a 6-tweet thread introducing the open-source tool "${repo.name}".

${ctx}

Format each tweet as:
1/ [Hook — one compelling sentence about the problem this tool solves]
2/ [What it is — clear description of the tool]
3/ [Why it matters — the security/engineering significance]
4/ [Key capability or feature — most impressive thing it can do]
5/ [Who should use it — target audience and use case]
6/ [CTA — link to GitHub, invite to star/contribute]

Requirements:
- Each tweet ≤ 280 characters
- Conversational but technically credible
- Number each tweet (1/, 2/, etc.)
- No filler phrases like "Excited to share"
- Include ${repo.htmlUrl} in the final tweet

Output only the numbered tweets, one per line.`;

    case 'linkedin':
      return `You are a technical content writer for Trail of Bits, a leading security research firm.

Write a LinkedIn post announcing/promoting the open-source tool "${repo.name}".

${ctx}

Requirements:
- 150–250 words
- Open with a hook (a question or bold statement about the problem)
- Explain what the tool does and why it was built
- Highlight 2–3 key capabilities as short bullet points
- Close with a CTA linking to ${repo.htmlUrl}
- Professional but not stiff — thought leadership tone
- Avoid buzzwords like "revolutionary", "game-changing", "cutting-edge"

Output only the post text.`;

    case 'blog-outline':
      return `You are a technical content writer for Trail of Bits, a leading security research firm.

Create a detailed blog post outline for an article about the open-source tool "${repo.name}".

${ctx}

The outline should follow this structure:
- Title (compelling, SEO-friendly)
- Meta description (150 chars)
- Introduction (hook + problem statement)
- Background (why this tool was needed)
- How It Works (technical overview, key components)
- Use Cases (2–3 concrete scenarios)
- Getting Started (installation + quick example)
- Conclusion + Next Steps
- Suggested internal/external links

For each section include: the heading, 2–3 bullet points of what to cover, and suggested word count.
Total target: ~1,500 words.

Output the outline in markdown format.`;

    case 'blog-full':
      return `You are a technical content writer for Trail of Bits, a leading security research firm.

Write a complete technical blog post about the open-source tool "${repo.name}".

${ctx}

Requirements:
- ~800–1,000 words
- Title + introduction that hooks both security researchers and engineers
- Explain the problem the tool solves (assume the reader is a developer, not a security expert)
- Walk through what the tool does and how it works at a high level
- Include 1–2 concrete use case examples (can be hypothetical but realistic)
- Add a "Getting Started" section with installation (use generic placeholder commands if you don't have the exact ones)
- Close with a call to action to visit ${repo.htmlUrl} and contribute
- Tone: authoritative, clear, not hype-driven
- Use markdown formatting (headers, code blocks, bullet lists)

Output the full blog post in markdown.`;

    case 'newsletter':
      return `You are a technical content writer for Trail of Bits, a leading security research firm.

Write a "Tool Spotlight" newsletter blurb for the open-source tool "${repo.name}" to be featured in a security-focused newsletter.

${ctx}

Requirements:
- 100–150 words
- Structured as: [1-sentence hook] → [what it is] → [why readers should care] → [link]
- Punchy and scannable — newsletter readers skim
- Mention the ${repo.stars.toLocaleString()} GitHub stars as a credibility signal
- End with: "→ Check it out: ${repo.htmlUrl}"
- No markdown headers, just flowing text with the arrow CTA at the end

Output only the blurb text.`;

    case 'pr-pitch':
      return `You are a PR and communications specialist for Trail of Bits, a leading security research firm.

Write a press release pitch for the open-source tool "${repo.name}" targeting security and developer media outlets (e.g. The Register, Dark Reading, Hacker News, InfoQ).

${ctx}

Format:
**HEADLINE:** (compelling, newsy)
**SUBHEADLINE:** (supporting context)
**LEDE PARAGRAPH:** (who, what, when, where, why — 2–3 sentences)
**KEY POINTS:**
- Point 1 (technical significance)
- Point 2 (market/industry relevance)
- Point 3 (availability/how to access)
**QUOTE PLACEHOLDER:** [Insert quote from Trail of Bits engineer: "..."]
**BOILERPLATE:** Short paragraph about Trail of Bits
**CONTACT:** press@trailofbits.com | ${repo.htmlUrl}

Output the formatted pitch.`;

    case 'technical-faq':
      return `You are a technical content writer for Trail of Bits, a leading security research firm.

Write a "Technical FAQ" for the open-source tool "${repo.name}". This will be published on the repo's README and website to improve SEO and AI discoverability (so AI assistants like ChatGPT and Claude can answer questions about this tool).

${ctx}

Write exactly 6 Q&A pairs covering:
1. What is ${repo.name} and what does it do?
2. Who should use ${repo.name} and for what use cases?
3. How does ${repo.name} work at a technical level?
4. How does ${repo.name} compare to similar tools?
5. How do I get started with ${repo.name}?
6. Is ${repo.name} actively maintained and production-ready?

Format as:
**Q: [question]**
A: [answer in 2–4 sentences, technically accurate, plain language]

Output only the Q&A pairs in markdown.`;
  }
}
