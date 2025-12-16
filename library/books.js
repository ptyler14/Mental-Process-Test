/* library/books.js */
const LIBRARY_DATA = [
    {
        id: "book-1",
        title: "The 4-Hour Workweek",
        author: "Tim Ferriss (Remix)",
        coverColor: "#2980b9", // Matches your accent color
        description: "Escape the 9-5, live anywhere, and join the New Rich.",
        chapters: [
            {
                title: "Ch 1: Definition & The New Rich",
                content: `
                    <h3>Who are the New Rich?</h3>
                    <p>The New Rich (NR) are those who abandon the deferred-life plan and create luxury lifestyles in the present using the currency of the New Rich: <strong>Time and Mobility</strong>.</p>
                    <div class="highlight-box">
                        <strong>Key Concept:</strong> Money is multiplied in practical value depending on the number of W's you control in your life: What you do, When you do it, Where you do it, and with Whom you do it.
                    </div>
                `,
                videoUrl: "https://www.youtube.com/embed/s685QAIh3jA", 
                actionIdea: "Define what you would do if you had $100M but still had to work 4 hours a week."
            },
            {
                title: "Ch 2: Elimination (80/20)",
                content: `
                    <h3>Productive vs. Busy</h3>
                    <p>Focus on being productive instead of busy. 80% of your outputs come from 20% of your inputs.</p>
                `,
                actionIdea: "Identify the 20% of tasks causing 80% of your stress."
            }
        ]
    },
    {
        id: "book-2",
        title: "Atomic Habits",
        author: "James Clear (Remix)",
        coverColor: "#2c3e50", // Matches your primary color
        description: "Tiny Changes, Remarkable Results.",
        chapters: [
            {
                title: "The 1% Rule",
                content: `<p>Habits are the compound interest of self-improvement.</p>`,
                actionIdea: "Pick one tiny habit to do for just 2 minutes today."
            }
        ]
    }
];
