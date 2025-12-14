/* Mermaid init for MkDocs Material.
   Diagrams render from fenced blocks: ```mermaid
*/

(function () {
  try {
    if (!window.mermaid) return;

    // Prefer a theme that reads well on Material.
    // Mermaid v10 uses `initialize` + `run`.
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'strict',
      flowchart: { curve: 'basis' },
    });

    // Material uses instant navigation; rerender on page change.
    function render() {
      try {
        window.mermaid.run({
          querySelector: '.mermaid',
        });
      } catch {
        // no-op
      }
    }

    // Initial render
    render();

    // Re-render after MkDocs Material navigation swaps the page.
    document.addEventListener('DOMContentLoaded', render);
    document.addEventListener('DOMContentLoaded', function () {
      // no-op placeholder
    });

    // Material emits 'navigation' events.
    document.addEventListener('navigation:complete', render);
  } catch {
    // no-op
  }
})();
