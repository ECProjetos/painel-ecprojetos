export type TimeEntriesRow = {
    id: number;
    user_id: string;
    entry_date: string;           // “YYYY-MM-DD”
    period: 1 | 2 | 3;
    entry_time: string | null;    // “HH:MM:SS”
    exit_time: string | null;
    created_at: string;           // ISO timestamp
    updated_at: string;
};
