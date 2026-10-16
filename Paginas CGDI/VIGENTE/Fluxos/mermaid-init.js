async function renderMermaid() {
  try {
    const module = await import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs");
    module.default.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "base",
      flowchart: { htmlLabels: true, useMaxWidth: false }
    });
    await module.default.run({ querySelector: ".mermaid" });
    document.querySelector(".diagram-fallback")?.remove();
  } catch {
    document.querySelector(".diagram-fallback")?.setAttribute("role", "status");
  }
}
renderMermaid();
