### ✅ Prompt to Improve Sidebar Behavior in `painel-ecprojetos`

---

We are working on improving the nested sidebar experience in our **Next.js** project (`painel-ecprojetos`). The sidebar is built using **Shadcn UI** components (especially `Collapsible`) and lives inside `src/components/sidebar/`.

### 🎯 Goal

Update the sidebar system so that:

* ✅ The **main sidebar** (`AppSidebar`) is **always visible** (fixed on the left).
* ✅ Only **one nested sidebar section** (`Collapsible`) can be expanded at a time.
* ✅ All other nested sections should automatically **collapse and show as icons only** when another one is opened.
* ✅ Apply this behavior **only** to pages under the `app/(private)/contre-horarios/` route (e.g. `layout.tsx`, subpages).
* ✅ Preserve and follow **existing styling patterns** and **micro interactions** used across the project.
* ✅ Maintain use of **Shadcn components**, **Tailwind CSS**, and shared UI standards.

---

### 🧠 Context (from documentation)

* The `AppSidebar` orchestrates all sections using `createData()` and passes structured data to subcomponents like `NavColaborador`, `NavGeneral`, etc.
* Nesting is achieved using the Shadcn `Collapsible` component, composed of `CollapsibleTrigger` and `CollapsibleContent`.
* Sub-menu items use components like `SidebarMenuSubItem` and `SidebarMenuSubButton`.
* Only pages inside `app/(private)/contre-horarios/` use the nested sidebar layout.

---

### 📌 What Needs to Be Done

* Implement **mutual exclusivity** among the nested `Collapsible` menus:

  * When a new section is expanded, automatically collapse any other open section.
  * Keep collapsed sections in **icon-only mode**.
* Make sure this behavior only activates when rendering inside `/app/(private)/contre-horarios/*`.
* Ensure existing `Nav` subcomponents can work with a shared state or context to manage the active section.
* Avoid breaking the current rendering logic in other sidebar routes/pages.
* Optional: persist the active section per page using route-based logic if appropriate.

---

### 📁 Key Files to Work In

* `src/components/sidebar/app-sidebar.tsx`
* `src/components/sidebar/nav-*.tsx` (e.g. `nav-colaborador.tsx`, etc.)
* `src/app/(private)/contre-horarios/layout.tsx` (where nested sidebar logic applies)
* `src/components/ui/collapsible.tsx` (if customization is needed)

---

### ✨ Bonus (Optional, UX)

* Add a subtle animation or micro-interaction when one `Collapsible` closes and another opens.
* Remember to keep performance in mind — avoid unnecessary re-renders.
