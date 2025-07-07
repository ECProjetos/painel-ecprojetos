import { SoftSkillsDashboard } from "@/components/plano-carreira/soft-skills-vw";

export default function SoftSkillsPage() {
    return (
        <div className="flex flex-col bg-white shadow-lg rounded-2xl p-2 sm:p-4 sm:px-6 lg:px-8 flex-1 min-h-[125vh] border dark:bg-[#1c1c20]">
            <SoftSkillsDashboard />
        </div>
    );
}