# UI scenarios

These scenarios are manual behavior checks. Each row links to the page that has the rule.

| Situation | Expected behavior | Rule |
| --- | --- | --- |
| New web page with no design system | Triage selects the UI guidelines and `ui-design`. The agent chooses a direction for the audience. | [Design systems](design-systems.md) |
| New web page with no design system | The agent does not add a default CSS framework. | [Index](index.md#boundaries) |
| New web page with no design system | The agent checks the 320 px and wide layouts in the rendered page. | [Web default](visual-verification.md#web-default) |
| Fix an existing Avalonia form | Keep the current tokens and controls. Do not redesign other views. | [Design systems](design-systems.md) |
| Fix an existing Avalonia form | Use `tdd-loop` for the behavior. Check the output with a headless renderer or the running application. | [Visual verification](visual-verification.md#protocol) |
| Review a mobile screen | Triage selects `ui-review` and `code-review` for a pull request. The reviewer changes no file. | [ui-review](../skills/ui-review/SKILL.md) |
| No rendering tools | Check the code and the tests. Write NOT RUN and name the surfaces and states that you did not check. | [Results](visual-verification.md#results) |
| No rendering tools | Do not write PASS from code inspection. | [Results](visual-verification.md#results) |
| Backend-only refactor | Select no UI skill. Do not ask for a screenshot. | [Index](index.md#boundaries) |
