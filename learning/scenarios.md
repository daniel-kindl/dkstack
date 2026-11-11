# Learning behavior scenarios

These scenarios describe expected agent behavior. They are manual behavioral checks, not proof that a model will always follow instructions.

| Input or situation | Expected behavior |
| --- | --- |
| "What is TCP?" | Answer directly. Do not start a quiz. |
| "Help me understand TCP" | Explore the concept without a full course. |
| "Teach me TCP from the start" | Enter Learn mode. Check prior knowledge where needed. |
| "I want to master networking" | Offer a small prerequisite map and guided learning. |
| Learner already demonstrated a concept | Skip redundant diagnostic questions. |
| Learner guesses the right result | Probe reasoning before raising proficiency. |
| Learner provides a partly correct answer | Identify the correct part and the gap. |
| Learner repeats the same misconception | Explain directly; then test a different case. |
| "Just tell me" | Give the answer. Do not force more hints. |
| "Assess my understanding of fractions" | Use unassisted questions and hold scored feedback until the end. |
| Learner requests a hint during an assessment | Provide it; mark that item assisted or unscored. |
| "Review what I learned" without saved state | Use available context or request a topic. Do not invent history. |
| "Save progress" without a filesystem | Emit a portable state block. Do not claim a file was written. |
| "Resume" with incomplete state | Use known facts and mark missing evidence unknown. |
| Learner switches from fractions to history | Follow the new goal without resistance. |
| Learner asks to stop | End the session and offer a brief summary. |
| No browser or external services | Teach using available knowledge, state uncertainty. |

Check at least a technical concept, a math concept and a nontechnical concept during review. Look for unwanted tutoring, unsupported mastery claims and needless barriers to direct answers.
