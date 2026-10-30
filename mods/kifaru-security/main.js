import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { spaces, agents, focused, props, theme, run, shared, setShared, setAgentOrder } from "herdr";

const steps = [
  ["01", "Define the boundary", "Identify assets, entry points and trust boundaries."],
  ["02", "Trace the input", "Follow attacker-controlled data to a sensitive operation."],
  ["03", "Prove the impact", "Capture a minimal reproduction and realistic preconditions."],
  ["04", "Verify the repair", "Retest the exploit and check adjacent behavior."],
  ["05", "Record the evidence", "Document scope, severity, source locations and limits."]
];
const statusColor = (t, s) => ({ working: t.working, blocked: t.blocked, done: t.done, idle: t.idle }[s] || t.dim);
const text = (value, color, size = 13) => div().text_size(size).text_color(color).child(value);
const button = (id, label, action) => div().id(id).px(10).py(6).rounded(5).text_size(12)
  .bg(theme().raised).hover(s => s.bg(theme().hover)).child(label).on_click(action);

export default class KifaruSecurity extends View {
  render() {
    const t = theme(), role = props()?.role, current = spaces().find(s => s.active);
    if (role === "bar") return h_flex().size_full().px(20).items_center().justify_between()
      .child(h_flex().gap(14).items_center().child(text("K /", t.accent, 24)).child(text("KIFARU", t.foreground, 17)).child(text("SECURITY WORKBENCH", t.muted, 11)))
      .child(h_flex().gap(8).child(button("review", "Review panel", () => run("layout.toggle", {id: "review"}))).child(button("palette", "Commands", () => run("app.palette"))));
    if (role === "tabs") return h_flex().size_full().gap(6).items_center()
      .children((current?.tabs || []).map(tab => button("tab-" + tab.id, (tab.active ? "• " : "") + tab.name, () => run("tab.select", {id:tab.id}))))
      .child(button("new-tab", "+ Terminal", () => run("tab.new")));
    if (role === "footer") return h_flex().size_full().px(16).items_center().justify_between()
      .child(text("EVIDENCE BEFORE SEVERITY", t.accent, 10))
      .child(text("Manual review • no automatic scanning • Ctrl Shift L: layouts", t.muted, 11));
    if (role === "nav") {
      const list = agents().slice().sort((a,b) => ({blocked:0,done:1,working:2,idle:3}[a.status] - {blocked:0,done:1,working:2,idle:3}[b.status]));
      setAgentOrder(list.map(a => a.address));
      return v_flex().id("nav").size_full().p(16).gap(10).overflow_y_scrollbar()
        .child(text("OPERATIONS", t.accent, 10))
        .children(spaces().map(s => v_flex().id("space-" + s.id).p(10).gap(5).rounded(6).bg(s.active ? t.selected : t.chrome).hover(el => el.bg(t.hover))
          .on_click(() => run("space.select", {id:s.id}))
          .child(text(s.name, s.active ? t.foreground : t.muted, 14))
          .child(text((s.machine || "local") + " / " + (s.branch || "no branch"), t.dim, 11))))
        .child(button("new-space", "+ New space", () => run("space.new")))
        .child(div().h(18)).child(text("AGENT WATCH / " + list.length, t.accent, 10))
        .children(list.map(a => v_flex().id("agent-" + a.address).p(10).gap(5).rounded(6).bg(t.surface).hover(el => el.bg(t.hover))
          .on_click(() => run("agent.focus", {terminal:a.address}))
          .child(text(a.status.toUpperCase() + " / " + (a.app || a.program.name), statusColor(t,a.status), 11))
          .child(text(a.tab_name, t.foreground)).child(text(a.address, t.dim, 10))))
        .when(!list.length, el => el.child(text("No reporting agents.\nStart one in a terminal.", t.muted, 12)));
    }
    const key = "kifaru-security.review." + (current?.id || "none");
    const checked = shared(key) || {};
    return v_flex().id("review-root").size_full().p(20).gap(15).overflow_y_scrollbar()
      .child(text("REVIEW PROTOCOL", t.accent, 10))
      .child(text("Make the case.", t.foreground, 25))
      .child(text("A finding needs a trace, an impact\nand evidence someone can repeat.", t.muted, 12))
      .child(text(current ? Object.values(checked).filter(Boolean).length + " / 5 steps recorded" : "Select a space to record progress", t.accent, 12))
      .children(steps.map(([n,title,detail]) => v_flex().id("step-"+n).p(12).gap(7).rounded(6).bg(t.surface)
        .hover(el => el.bg(t.hover)).on_click(() => {if(current) setShared(key, {...(shared(key) || {}), [n]: !(shared(key) || {})[n]});})
        .child(text((checked[n] ? "[x] " : "[ ] ") + n + "  " + title, checked[n] ? t.accent : t.foreground, 13))
        .child(text(detail, t.muted, 12))))
      .child(text("Manual notes of progress only.\nA checked step is not a security verdict.", t.dim, 11))
      .child(button("reset", "Reset this review", () => {if(current) setShared(key, {});}));
  }
}
