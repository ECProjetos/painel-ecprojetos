export interface TimeEntryDaily {
    user_id: string;
    user_name: string;
    entry_date: string;      // ISO date, ex: "2025-04-01"
    p1_entry: string | null; // ex: "08:00:00"
    p1_exit: string | null;
    p2_entry: string | null;
    p2_exit: string | null;
    p3_entry: string | null;
    p3_exit: string | null;
    hours_to_do: string;     // ex: "08:00:00"
    hours_done: string;      // ex: "09:35:00"
    hours_balance: string;   // ex: "01:35:00" ou "-00:30:00"
    year: number;
    month: number;
}
